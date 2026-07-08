-- ============================================================================
-- Migration: replace patient_full_name with ssnit_number on telemedicine_entries
-- Run this once in the SQL Editor against an already-deployed project that
-- was set up from an earlier version of supabase/schema.sql.
--
-- IMPORTANT: the new CHECK constraint requires every existing row's value to
-- already match ^[A-Z][0-9]{12}$ (one capital letter + 12 digits, 13 chars
-- total). If you only have test/dummy entries so far, the simplest path is
-- to clear them first (uncomment the truncate line below). If you have real
-- data you need to keep, populate valid ssnit_number values for every
-- existing row BEFORE running the rename + constraint, or the migration
-- will fail with a constraint violation and nothing will be changed.
-- ============================================================================

-- Uncomment if you only have test/dummy entries and want a clean slate:
-- truncate table public.telemedicine_entries restart identity cascade;

alter table public.telemedicine_entries rename column patient_full_name to ssnit_number;

alter table public.telemedicine_entries
  add constraint telemedicine_entries_ssnit_number_check check (ssnit_number ~ '^[A-Z][0-9]{12}$');

drop index if exists idx_entries_dup_key;
create index idx_entries_dup_key on public.telemedicine_entries (ssnit_number);

create or replace view public.v_entries_computed
with (security_invoker = true) as
with base as (
  select
    e.*,
    rp.label as reporting_period,
    wc.label as weekly_cycle,
    r.label as region,
    et.label as engagement_type,
    dc.label as digital_channel_used,
    fc.label as feedback_category,
    pl.label as priority_level,
    ru.label as responsible_unit,
    st.label as status,
    row_number() over (
      order by e.date_of_interaction asc, e.created_at asc, e.entry_id asc
    ) as recency_rank
  from public.telemedicine_entries e
  left join public.reporting_periods rp on rp.id = e.reporting_period_id
  left join public.weekly_cycles wc on wc.id = e.weekly_cycle_id
  left join public.regions r on r.id = e.region_id
  left join public.engagement_types et on et.id = e.engagement_type_id
  left join public.digital_channels dc on dc.id = e.digital_channel_id
  left join public.feedback_categories fc on fc.id = e.feedback_category_id
  left join public.priority_levels pl on pl.id = e.priority_level_id
  left join public.responsible_units ru on ru.id = e.responsible_unit_id
  left join public.statuses st on st.id = e.status_id
  where e.is_deleted = false
)
select
  b.*,
  case when b.feedback_category = 'Positive' then 'Yes' else 'No' end as positive_feedback,
  case when b.feedback_category = 'Complaint' then 'Yes' else 'No' end as complaint,
  case when b.feedback_category = 'Suggestion' then 'Yes' else 'No' end as suggestion,
  'Q' || ceil(extract(month from b.date_of_interaction) / 3.0)::int
      || ' ' || extract(year from b.date_of_interaction)::int as quarter,
  case
    when count(*) over (partition by b.ssnit_number) > 1
    then 'DUPLICATE'
  end as duplicate_flag,
  case
    when coalesce(b.telephone_number, '') = ''
     and coalesce(b.alternative_contact_number, '') = ''
     and coalesce(b.email_address, '') = ''
    then 'MISSING CONTACT'
  end as contact_missing,
  case
    when length(regexp_replace(coalesce(b.telephone_number, ''), '[ +-]', '', 'g')) < 10
    then 'CHECK NUMBER'
  end as phone_check,
  case
    when nullif(trim(b.recommendation), '') is not null
     and row_number() over (partition by b.recommendation order by b.date_of_interaction, b.created_at, b.entry_id) = 1
    then (case b.priority_level when 'High' then 3 when 'Medium' then 2 else 1 end) * 1000000 + b.recency_rank
  end as recommendation_sort_key,
  case
    when nullif(trim(b.key_observation), '') is not null
     and row_number() over (partition by b.key_observation order by b.date_of_interaction, b.created_at, b.entry_id) = 1
    then b.recency_rank
  end as observation_sort_key,
  case
    when nullif(trim(b.root_cause), '') is not null
     and (b.escalation_required is true or b.priority_level = 'High')
     and row_number() over (partition by b.root_cause order by b.date_of_interaction, b.created_at, b.entry_id) = 1
    then b.recency_rank
  end as risk_sort_key,
  case
    when nullif(trim(b.emerging_trend), '') is not null
     and (b.feedback_category = 'Suggestion' or nullif(trim(b.emerging_trend), '') is not null)
     and row_number() over (partition by b.emerging_trend order by b.date_of_interaction, b.created_at, b.entry_id) = 1
    then b.recency_rank
  end as opportunity_sort_key
from base b;

grant select on public.v_entries_computed to authenticated;
