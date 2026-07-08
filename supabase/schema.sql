-- ============================================================================
-- Telehealth Reporting System — Trust Hospital <-> SSNIT
-- Consolidated schema: extensions, tables, view, functions, triggers, RLS.
-- Apply once via the Supabase SQL Editor (or `psql`) against a fresh project.
-- Idempotent-ish: uses IF NOT EXISTS / OR REPLACE where practical, but is
-- intended to run once against an empty database.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. Identity / access tables
-- ============================================================================

create table public.institutions (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  type text not null check (type in ('hospital', 'ssnit', 'system')),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  institution_id uuid references public.institutions (id),
  full_name text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id serial primary key,
  name text not null unique check (name in (
    'Trust Hospital Admin',
    'Trust Hospital Data Entry Officer',
    'Trust Hospital Reviewer',
    'SSNIT Viewer',
    'SSNIT Executive Viewer',
    'System Admin'
  ))
);

create table public.user_roles (
  id serial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id int not null references public.roles (id) on delete cascade,
  institution_id uuid references public.institutions (id),
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

-- Structural seed data (fixed, not user-editable "lists")
insert into public.institutions (name, type) values
  ('The Trust Hospital', 'hospital'),
  ('SSNIT', 'ssnit'),
  ('System', 'system');

insert into public.roles (name) values
  ('Trust Hospital Admin'),
  ('Trust Hospital Data Entry Officer'),
  ('Trust Hospital Reviewer'),
  ('SSNIT Viewer'),
  ('SSNIT Executive Viewer'),
  ('System Admin');

-- ============================================================================
-- 2. Configuration / dropdown lookup tables (mirrors workbook "Lists" sheet)
-- ============================================================================

create table public.reporting_periods (
  id serial primary key, label text not null unique,
  sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.weekly_cycles (
  id serial primary key, label text not null unique,
  sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.engagement_types (
  id serial primary key, label text not null unique,
  sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.digital_channels (
  id serial primary key, label text not null unique,
  sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.feedback_categories (
  id serial primary key, label text not null unique,
  sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.priority_levels (
  id serial primary key, label text not null unique,
  sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.statuses (
  id serial primary key, label text not null unique,
  sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.regions (
  id serial primary key, label text not null unique,
  sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.responsible_units (
  id serial primary key, label text not null unique,
  sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.platforms (
  id serial primary key, label text not null unique,
  sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 3. telemedicine_entries (raw input only — computed fields live in the view)
-- ============================================================================

create sequence public.entry_id_seq;

create table public.telemedicine_entries (
  id uuid primary key default uuid_generate_v4(),
  entry_id text not null unique default ('TTH-' || lpad(nextval('public.entry_id_seq')::text, 4, '0')),
  institution_id uuid not null references public.institutions (id),

  reporting_period_id int references public.reporting_periods (id),
  weekly_cycle_id int references public.weekly_cycles (id),
  date_of_interaction date not null,
  cro_name text,

  ssnit_number text not null check (ssnit_number ~ '^[A-Z][0-9]{12}$'),
  telephone_number text,
  alternative_contact_number text,
  email_address text,
  physical_location text,
  region_id int references public.regions (id),

  engagement_type_id int references public.engagement_types (id),
  digital_channel_id int references public.digital_channels (id),

  feedback_category_id int references public.feedback_categories (id),
  detailed_feedback_narrative text,

  successful_contact boolean,
  issue_resolved boolean,
  escalation_required boolean,

  key_observation text,
  root_cause text,
  emerging_trend text,
  recommendation text,
  priority_level_id int references public.priority_levels (id),
  responsible_unit_id int references public.responsible_units (id),
  status_id int references public.statuses (id),

  is_deleted boolean not null default false,
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_entries_period on public.telemedicine_entries (reporting_period_id);
create index idx_entries_cycle on public.telemedicine_entries (weekly_cycle_id);
create index idx_entries_institution on public.telemedicine_entries (institution_id);
create index idx_entries_date on public.telemedicine_entries (date_of_interaction);
create index idx_entries_dup_key on public.telemedicine_entries (ssnit_number);

-- ============================================================================
-- 4. report_snapshots & audit_logs
-- ============================================================================

create table public.report_snapshots (
  id uuid primary key default uuid_generate_v4(),
  report_type text not null check (report_type in ('weekly', 'monthly', 'quarterly', 'executive')),
  period_label text,
  generated_by uuid references public.profiles (id),
  generated_at timestamptz not null default now(),
  export_format text check (export_format in ('pdf', 'excel', 'csv')),
  params jsonb
);

create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles (id),
  action text not null,
  table_name text,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  event_type text not null check (event_type in ('crud', 'login', 'logout', 'export', 'view')),
  created_at timestamptz not null default now()
);

create index idx_audit_actor on public.audit_logs (actor_id);
create index idx_audit_created on public.audit_logs (created_at desc);

-- ============================================================================
-- 5. Helper functions
-- ============================================================================

create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.name = p_role
  );
$$;

create or replace function public.is_trust_hospital_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('Trust Hospital Admin')
      or public.has_role('Trust Hospital Data Entry Officer')
      or public.has_role('Trust Hospital Reviewer');
$$;

create or replace function public.is_ssnit_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('SSNIT Viewer') or public.has_role('SSNIT Executive Viewer');
$$;

create or replace function public.user_institution_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select institution_id from public.profiles where id = auth.uid();
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_entries_updated_at before update on public.telemedicine_entries
  for each row execute function public.set_updated_at();

-- Soft-delete (is_deleted flip) is Admin-only even though the broader
-- entries_update RLS policy also allows Data Entry Officers to edit fields.
create or replace function public.fn_guard_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_deleted is distinct from old.is_deleted
     and not (public.has_role('Trust Hospital Admin') or public.has_role('System Admin')) then
    raise exception 'only Trust Hospital Admin or System Admin can delete/restore an entry';
  end if;
  return new;
end;
$$;

create trigger trg_entries_guard_soft_delete before update on public.telemedicine_entries
  for each row execute function public.fn_guard_soft_delete();

-- Auto-create a profile row when a Supabase Auth user is created.
-- Institution + role are deliberately NOT set here — a System Admin assigns
-- them afterwards via the User Management page (keeps account creation and
-- privilege assignment as two distinct, auditable steps).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 6. Derived view — Excel-formula-equivalent computed columns
-- ============================================================================

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

-- ============================================================================
-- 7. Audit trigger (generic, attached per-table below)
-- ============================================================================

create or replace function public.fn_audit_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record_id text;
begin
  v_record_id := coalesce(
    (case when TG_OP = 'DELETE' then old.id else new.id end)::text,
    ''
  );
  insert into public.audit_logs (actor_id, action, table_name, record_id, old_data, new_data, event_type)
  values (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    v_record_id,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    'crud'
  );
  return coalesce(new, old);
end;
$$;

create trigger trg_audit_entries
  after insert or update or delete on public.telemedicine_entries
  for each row execute function public.fn_audit_row();
create trigger trg_audit_user_roles
  after insert or update or delete on public.user_roles
  for each row execute function public.fn_audit_row();
create trigger trg_audit_reporting_periods after insert or update or delete on public.reporting_periods for each row execute function public.fn_audit_row();
create trigger trg_audit_weekly_cycles after insert or update or delete on public.weekly_cycles for each row execute function public.fn_audit_row();
create trigger trg_audit_engagement_types after insert or update or delete on public.engagement_types for each row execute function public.fn_audit_row();
create trigger trg_audit_digital_channels after insert or update or delete on public.digital_channels for each row execute function public.fn_audit_row();
create trigger trg_audit_feedback_categories after insert or update or delete on public.feedback_categories for each row execute function public.fn_audit_row();
create trigger trg_audit_priority_levels after insert or update or delete on public.priority_levels for each row execute function public.fn_audit_row();
create trigger trg_audit_statuses after insert or update or delete on public.statuses for each row execute function public.fn_audit_row();
create trigger trg_audit_regions after insert or update or delete on public.regions for each row execute function public.fn_audit_row();
create trigger trg_audit_responsible_units after insert or update or delete on public.responsible_units for each row execute function public.fn_audit_row();
create trigger trg_audit_platforms after insert or update or delete on public.platforms for each row execute function public.fn_audit_row();

-- Client-side event logging (login/logout/export/view) — insert-only RPC,
-- no client INSERT policy exists on audit_logs at all.
create or replace function public.log_client_event(
  p_action text,
  p_event_type text,
  p_table_name text default null,
  p_record_id text default null,
  p_details jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_type not in ('login', 'logout', 'export', 'view') then
    raise exception 'invalid event_type for log_client_event: %', p_event_type;
  end if;
  insert into public.audit_logs (actor_id, action, table_name, record_id, new_data, event_type)
  values (auth.uid(), p_action, p_table_name, p_record_id, p_details, p_event_type);
end;
$$;

-- ============================================================================
-- 8. Reporting RPC functions
-- ============================================================================

-- 8.1 Weekly Summary — filtered to one reporting period + weekly cycle.
-- Ranking for Top 3 Observations/Recommendations is recomputed WITHIN this
-- filtered subset (the one place scoping differs from the global view).
create or replace function public.get_weekly_summary(p_period_id int, p_cycle_id int)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not (public.is_trust_hospital_role() or public.is_ssnit_role() or public.has_role('System Admin')) then
    raise exception 'not authorized';
  end if;

  with scoped as (
    select *
    from public.v_entries_computed
    where reporting_period_id = p_period_id and weekly_cycle_id = p_cycle_id
  ),
  ranked_obs as (
    select key_observation,
      row_number() over (partition by key_observation order by date_of_interaction, created_at, entry_id) as rn,
      row_number() over (order by date_of_interaction, created_at, entry_id) as recency
    from scoped
    where nullif(trim(key_observation), '') is not null
  ),
  top_obs as (
    select key_observation from ranked_obs where rn = 1 order by recency desc limit 3
  ),
  ranked_rec as (
    select recommendation, priority_level,
      row_number() over (partition by recommendation order by date_of_interaction, created_at, entry_id) as rn,
      row_number() over (order by date_of_interaction, created_at, entry_id) as recency
    from scoped
    where nullif(trim(recommendation), '') is not null
  ),
  top_rec as (
    select recommendation
    from ranked_rec where rn = 1
    order by (case priority_level when 'High' then 3 when 'Medium' then 2 else 1 end) desc, recency desc
    limit 3
  )
  select jsonb_build_object(
    'total_patients_contacted', (select count(*) from scoped where successful_contact is true),
    'total_followup_activities', (select count(*) from scoped),
    'total_feedback_collected', (select count(*) from scoped where feedback_category is not null),
    'total_complaints', (select count(*) from scoped where complaint = 'Yes'),
    'total_issues_resolved', (select count(*) from scoped where issue_resolved is true),
    'positive_feedback', (select count(*) from scoped where positive_feedback = 'Yes'),
    'complaints', (select count(*) from scoped where complaint = 'Yes'),
    'suggestions', (select count(*) from scoped where suggestion = 'Yes'),
    'neutral_other', (select count(*) from scoped where feedback_category = 'Neutral'),
    'top_observations', (select coalesce(jsonb_agg(key_observation), '[]'::jsonb) from top_obs),
    'top_recommendations', (select coalesce(jsonb_agg(recommendation), '[]'::jsonb) from top_rec)
  ) into v_result;

  return v_result;
end;
$$;

-- 8.2 Monthly Consolidation — Jan-Dec + Year Total, global Top 5 lists.
create or replace function public.get_monthly_consolidation(p_year int)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_months jsonb;
  v_top_observations jsonb;
  v_top_recommendations jsonb;
  v_top_risks jsonb;
  v_top_opportunities jsonb;
begin
  if not (public.is_trust_hospital_role() or public.is_ssnit_role() or public.has_role('System Admin')) then
    raise exception 'not authorized';
  end if;

  with months as (
    select rp.id as period_id, rp.label, rp.sort_order
    from public.reporting_periods rp
    where rp.label ilike '%' || p_year::text
    order by rp.sort_order
  ),
  metrics as (
    select
      m.label,
      m.sort_order,
      count(*) filter (where e.successful_contact is true) as patients_contacted,
      count(*) as followup_activities,
      count(*) filter (where e.feedback_category is not null) as feedback_records,
      count(*) filter (where e.complaint = 'Yes') as complaints,
      count(*) filter (where e.issue_resolved is true) as issues_resolved,
      count(*) filter (where e.escalation_required is true) as escalations
    from months m
    left join public.v_entries_computed e on e.reporting_period_id = m.period_id
    group by m.label, m.sort_order
  )
  select jsonb_agg(jsonb_build_object(
    'month', label,
    'patients_contacted', patients_contacted,
    'followup_activities', followup_activities,
    'feedback_records', feedback_records,
    'complaints', complaints,
    'issues_resolved', issues_resolved,
    'escalations', escalations
  ) order by sort_order)
  into v_months
  from metrics;

  select coalesce(jsonb_agg(key_observation order by observation_sort_key desc), '[]'::jsonb)
  into v_top_observations
  from (
    select key_observation, observation_sort_key
    from public.v_entries_computed
    where observation_sort_key is not null
    order by observation_sort_key desc limit 5
  ) t;

  select coalesce(jsonb_agg(recommendation order by recommendation_sort_key desc), '[]'::jsonb)
  into v_top_recommendations
  from (
    select recommendation, recommendation_sort_key
    from public.v_entries_computed
    where recommendation_sort_key is not null
    order by recommendation_sort_key desc limit 5
  ) t;

  select coalesce(jsonb_agg(root_cause order by risk_sort_key desc), '[]'::jsonb)
  into v_top_risks
  from (
    select root_cause, risk_sort_key
    from public.v_entries_computed
    where risk_sort_key is not null
    order by risk_sort_key desc limit 5
  ) t;

  select coalesce(jsonb_agg(emerging_trend order by opportunity_sort_key desc), '[]'::jsonb)
  into v_top_opportunities
  from (
    select emerging_trend, opportunity_sort_key
    from public.v_entries_computed
    where opportunity_sort_key is not null
    order by opportunity_sort_key desc limit 5
  ) t;

  return jsonb_build_object(
    'year', p_year,
    'months', coalesce(v_months, '[]'::jsonb),
    'year_total', (
      select jsonb_build_object(
        'patients_contacted', coalesce(sum((m ->> 'patients_contacted')::int), 0),
        'followup_activities', coalesce(sum((m ->> 'followup_activities')::int), 0),
        'feedback_records', coalesce(sum((m ->> 'feedback_records')::int), 0),
        'complaints', coalesce(sum((m ->> 'complaints')::int), 0),
        'issues_resolved', coalesce(sum((m ->> 'issues_resolved')::int), 0),
        'escalations', coalesce(sum((m ->> 'escalations')::int), 0)
      )
      from jsonb_array_elements(coalesce(v_months, '[]'::jsonb)) m
    ),
    'top_observations', v_top_observations,
    'top_recommendations', v_top_recommendations,
    'top_risks', v_top_risks,
    'top_opportunities', v_top_opportunities
  );
end;
$$;

-- 8.3 Quarterly Consolidation — sums the monthly RPC into Q1-Q4 + Year Total.
create or replace function public.get_quarterly_consolidation(p_year int)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_monthly jsonb;
  v_quarters jsonb;
  v_busiest_month jsonb;
  v_busiest_quarter jsonb;
  v_months_with_activity int;
begin
  if not (public.is_trust_hospital_role() or public.is_ssnit_role() or public.has_role('System Admin')) then
    raise exception 'not authorized';
  end if;

  v_monthly := public.get_monthly_consolidation(p_year);

  with months as (
    select
      month_num,
      (m ->> 'month') as month,
      (m ->> 'patients_contacted')::int as patients_contacted,
      (m ->> 'followup_activities')::int as followup_activities,
      (m ->> 'feedback_records')::int as feedback_records,
      (m ->> 'complaints')::int as complaints,
      (m ->> 'issues_resolved')::int as issues_resolved,
      (m ->> 'escalations')::int as escalations
    from jsonb_array_elements(v_monthly -> 'months') with ordinality as t(m, month_num)
  ),
  quarters as (
    select
      ceil(month_num / 3.0)::int as quarter_num,
      sum(patients_contacted) as patients_contacted,
      sum(followup_activities) as followup_activities,
      sum(feedback_records) as feedback_records,
      sum(complaints) as complaints,
      sum(issues_resolved) as issues_resolved,
      sum(escalations) as escalations
    from months
    group by ceil(month_num / 3.0)
  )
  select jsonb_agg(jsonb_build_object(
    'quarter', 'Q' || quarter_num,
    'patients_contacted', patients_contacted,
    'followup_activities', followup_activities,
    'feedback_records', feedback_records,
    'complaints', complaints,
    'issues_resolved', issues_resolved,
    'escalations', escalations
  ) order by quarter_num)
  into v_quarters
  from quarters;

  select jsonb_build_object('month', month, 'patients_contacted', patients_contacted)
  into v_busiest_month
  from months order by patients_contacted desc, month_num asc limit 1;

  select jsonb_build_object('quarter', q ->> 'quarter', 'patients_contacted', (q ->> 'patients_contacted')::int)
  into v_busiest_quarter
  from jsonb_array_elements(v_quarters) q
  order by (q ->> 'patients_contacted')::int desc limit 1;

  select count(*) into v_months_with_activity
  from months where followup_activities > 0;

  return jsonb_build_object(
    'year', p_year,
    'quarters', coalesce(v_quarters, '[]'::jsonb),
    'year_total', v_monthly -> 'year_total',
    'busiest_month', v_busiest_month,
    'busiest_quarter', v_busiest_quarter,
    'months_with_activity', v_months_with_activity,
    'emerging_trends', v_monthly -> 'top_opportunities',
    'major_service_concerns', v_monthly -> 'top_risks',
    'key_recommendations_for_management', v_monthly -> 'top_recommendations'
  );
end;
$$;

-- 8.4 Executive Dashboard — KPI cards, chart series, region heatmap, insights.
create or replace function public.get_executive_dashboard(p_year int default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_year int := coalesce(p_year, extract(year from now())::int);
  v_kpis jsonb;
  v_monthly_trend jsonb;
  v_engagement_breakdown jsonb;
  v_feedback_breakdown jsonb;
  v_heatmap jsonb;
  v_monthly jsonb;
begin
  if not (public.is_trust_hospital_role() or public.is_ssnit_role() or public.has_role('System Admin')) then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'total_patients_contacted', count(*) filter (where successful_contact is true),
    'total_followup_activities', count(*),
    'total_complaints', count(*) filter (where complaint = 'Yes'),
    'issues_resolved', count(*) filter (where issue_resolved is true),
    'open_issues', count(*) filter (where status = 'Open'),
    'closed_issues', count(*) filter (where status = 'Closed')
  ) into v_kpis
  from public.v_entries_computed;

  v_monthly := public.get_monthly_consolidation(v_year);

  select jsonb_agg(jsonb_build_object(
    'month', m ->> 'month',
    'patients_contacted', (m ->> 'patients_contacted')::int,
    'followup_activities', (m ->> 'followup_activities')::int,
    'complaints', (m ->> 'complaints')::int
  ))
  into v_monthly_trend
  from jsonb_array_elements(v_monthly -> 'months') m;

  select jsonb_agg(jsonb_build_object(
    'engagement_type', et.label,
    'activities', coalesce(a.cnt, 0),
    'complaints', coalesce(c.cnt, 0)
  ) order by et.sort_order)
  into v_engagement_breakdown
  from public.engagement_types et
  left join (
    select engagement_type_id, count(*) cnt from public.v_entries_computed group by engagement_type_id
  ) a on a.engagement_type_id = et.id
  left join (
    select engagement_type_id, count(*) cnt from public.v_entries_computed where complaint = 'Yes' group by engagement_type_id
  ) c on c.engagement_type_id = et.id
  where et.is_active;

  select jsonb_agg(jsonb_build_object('category', fc.label, 'count', coalesce(x.cnt, 0)) order by fc.sort_order)
  into v_feedback_breakdown
  from public.feedback_categories fc
  left join (
    select feedback_category_id, count(*) cnt from public.v_entries_computed group by feedback_category_id
  ) x on x.feedback_category_id = fc.id
  where fc.is_active;

  select jsonb_agg(jsonb_build_object(
    'region', r.label,
    'q1', coalesce(cnt_q1, 0), 'q2', coalesce(cnt_q2, 0),
    'q3', coalesce(cnt_q3, 0), 'q4', coalesce(cnt_q4, 0)
  ) order by r.sort_order)
  into v_heatmap
  from public.regions r
  left join (
    select region_id,
      count(*) filter (where quarter = 'Q1 ' || v_year::text) as cnt_q1,
      count(*) filter (where quarter = 'Q2 ' || v_year::text) as cnt_q2,
      count(*) filter (where quarter = 'Q3 ' || v_year::text) as cnt_q3,
      count(*) filter (where quarter = 'Q4 ' || v_year::text) as cnt_q4
    from public.v_entries_computed
    group by region_id
  ) q on q.region_id = r.id
  where r.is_active;

  return jsonb_build_object(
    'year', v_year,
    'kpis', v_kpis,
    'monthly_trend', coalesce(v_monthly_trend, '[]'::jsonb),
    'engagement_breakdown', coalesce(v_engagement_breakdown, '[]'::jsonb),
    'feedback_breakdown', coalesce(v_feedback_breakdown, '[]'::jsonb),
    'region_heatmap', coalesce(v_heatmap, '[]'::jsonb),
    'top_observations', v_monthly -> 'top_observations',
    'top_risks', v_monthly -> 'top_risks',
    'top_recommendations', v_monthly -> 'top_recommendations',
    'top_opportunities', v_monthly -> 'top_opportunities'
  );
end;
$$;

-- 8.5 Reviewer-only status update (Reviewer role cannot rewrite full rows)
create or replace function public.review_entry(
  p_entry_id uuid,
  p_status_id int,
  p_recommendation text default null,
  p_priority_level_id int default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.has_role('Trust Hospital Reviewer') or public.has_role('Trust Hospital Admin') or public.has_role('System Admin')) then
    raise exception 'not authorized';
  end if;

  update public.telemedicine_entries
  set status_id = p_status_id,
      recommendation = coalesce(p_recommendation, recommendation),
      priority_level_id = coalesce(p_priority_level_id, priority_level_id),
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_entry_id
    and institution_id = public.user_institution_id();
end;
$$;

-- ============================================================================
-- 9. Row Level Security
-- ============================================================================

alter table public.institutions enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.telemedicine_entries enable row level security;
alter table public.report_snapshots enable row level security;
alter table public.audit_logs enable row level security;
alter table public.reporting_periods enable row level security;
alter table public.weekly_cycles enable row level security;
alter table public.engagement_types enable row level security;
alter table public.digital_channels enable row level security;
alter table public.feedback_categories enable row level security;
alter table public.priority_levels enable row level security;
alter table public.statuses enable row level security;
alter table public.regions enable row level security;
alter table public.responsible_units enable row level security;
alter table public.platforms enable row level security;

-- institutions: readable by all authenticated, writable only by System Admin
create policy "institutions_select" on public.institutions for select to authenticated using (true);
create policy "institutions_write" on public.institutions for all to authenticated
  using (public.has_role('System Admin')) with check (public.has_role('System Admin'));

-- profiles: self-select, System Admin sees/writes all
create policy "profiles_select_self" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role('System Admin'));
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = auth.uid() or public.has_role('System Admin'))
  with check (id = auth.uid() or public.has_role('System Admin'));
create policy "profiles_admin_write" on public.profiles for insert to authenticated
  with check (public.has_role('System Admin'));

-- roles: readable by all authenticated; immutable via app (no write policy)
create policy "roles_select" on public.roles for select to authenticated using (true);

-- user_roles: self-select, System Admin full control
create policy "user_roles_select" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role('System Admin'));
create policy "user_roles_write" on public.user_roles for all to authenticated
  using (public.has_role('System Admin')) with check (public.has_role('System Admin'));

-- config lookup tables: readable by all authenticated, writable only by System Admin
do $$
declare
  t text;
begin
  foreach t in array array[
    'reporting_periods','weekly_cycles','engagement_types','digital_channels',
    'feedback_categories','priority_levels','statuses','regions',
    'responsible_units','platforms'
  ]
  loop
    execute format('create policy "%1$s_select" on public.%1$s for select to authenticated using (true);', t);
    execute format('create policy "%1$s_write" on public.%1$s for all to authenticated using (public.has_role(''System Admin'')) with check (public.has_role(''System Admin''));', t);
  end loop;
end $$;

-- telemedicine_entries
create policy "entries_select" on public.telemedicine_entries for select to authenticated
  using (
    public.is_ssnit_role()
    or public.has_role('System Admin')
    or (public.is_trust_hospital_role() and institution_id = public.user_institution_id())
  );

create policy "entries_insert" on public.telemedicine_entries for insert to authenticated
  with check (
    (public.has_role('Trust Hospital Data Entry Officer') or public.has_role('Trust Hospital Admin'))
    and institution_id = public.user_institution_id()
  );

create policy "entries_update" on public.telemedicine_entries for update to authenticated
  using (
    (public.has_role('Trust Hospital Data Entry Officer') or public.has_role('Trust Hospital Admin') or public.has_role('System Admin'))
    and institution_id = public.user_institution_id()
  )
  with check (
    (public.has_role('Trust Hospital Data Entry Officer') or public.has_role('Trust Hospital Admin') or public.has_role('System Admin'))
    and institution_id = public.user_institution_id()
  );

-- No DELETE policy: hard deletes are never allowed; soft-delete via UPDATE above.

-- report_snapshots
create policy "snapshots_select" on public.report_snapshots for select to authenticated
  using (
    public.is_ssnit_role()
    or public.has_role('System Admin')
    or (
      public.is_trust_hospital_role()
      and generated_by in (select id from public.profiles where institution_id = public.user_institution_id())
    )
  );
create policy "snapshots_insert" on public.report_snapshots for insert to authenticated
  with check (generated_by = auth.uid());

-- audit_logs: no client INSERT policy (writers are the trigger + log_client_event RPC only)
create policy "audit_select" on public.audit_logs for select to authenticated
  using (
    public.has_role('System Admin')
    or (
      public.has_role('Trust Hospital Admin')
      and actor_id in (select id from public.profiles where institution_id = public.user_institution_id())
    )
  );

-- ============================================================================
-- 10. Grants
-- ============================================================================

grant usage on schema public to authenticated;
grant select, insert, update on public.telemedicine_entries to authenticated;
grant select on public.v_entries_computed to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.roles, public.user_roles, public.institutions to authenticated;
grant select, insert, update, delete on
  public.reporting_periods, public.weekly_cycles, public.engagement_types,
  public.digital_channels, public.feedback_categories, public.priority_levels,
  public.statuses, public.regions, public.responsible_units, public.platforms
  to authenticated;
grant select, insert on public.report_snapshots to authenticated;
grant select on public.audit_logs to authenticated;
grant execute on function public.get_weekly_summary(int, int) to authenticated;
grant execute on function public.get_monthly_consolidation(int) to authenticated;
grant execute on function public.get_quarterly_consolidation(int) to authenticated;
grant execute on function public.get_executive_dashboard(int) to authenticated;
grant execute on function public.log_client_event(text, text, text, text, jsonb) to authenticated;
grant execute on function public.review_entry(uuid, int, text, int) to authenticated;
