-- ============================================================================
-- Sample data generator — 520 telemedicine_entries rows spanning
-- Jan 2026 through Jul 2026 (inclusive), with varied values per week.
--
-- Run this ONCE, after schema.sql + seed.sql (and the ssnit_number migration)
-- have already been applied. It's for demo/testing purposes — running it
-- twice will insert a second batch of 520 rows on top of the first, not
-- replace it.
--
-- What it does:
--   - Picks a random date for each row between 2026-01-01 and 2026-07-31.
--   - Derives reporting_period_id and weekly_cycle_id FROM that date
--     (so Weekly Summary / Monthly / Quarterly reports line up correctly).
--   - Draws region, engagement type, digital channel, feedback category,
--     priority, responsible unit and status from the seeded config lists.
--   - Reuses a pool of 180 SSNIT numbers across the 520 rows (patients
--     legitimately get contacted more than once across weeks), so the
--     DUPLICATE flag has real examples to show.
--   - Randomly leaves some contact fields blank (MISSING CONTACT) and some
--     phone numbers short (CHECK NUMBER) to exercise those flags too.
--   - Fills key_observation / root_cause / emerging_trend / recommendation
--     from small phrase pools (not one-off unique text) so the Top-5
--     observation/recommendation/risk/opportunity rankings have something
--     real to rank.
-- ============================================================================

do $$
begin
  if not exists (select 1 from public.institutions where name = 'The Trust Hospital') then
    raise exception 'Run supabase/schema.sql and supabase/seed.sql first.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'telemedicine_entries'
                   and column_name = 'ssnit_number') then
    raise exception 'Run supabase/migrations/20260708_ssnit_number.sql first.';
  end if;
end $$;

with
hospital as (
  select id from public.institutions where name = 'The Trust Hospital'
),
arrays as (
  select
    array(select id from public.regions order by id) as region_ids,
    array(select id from public.engagement_types order by id) as engagement_ids,
    array(select id from public.digital_channels order by id) as channel_ids,
    array(select id from public.priority_levels order by id) as priority_ids,
    array(select id from public.responsible_units order by id) as unit_ids,
    array(select id from public.statuses order by id) as status_ids,
    array['Ama Mensah','Kwame Owusu','Efua Sarpong','Kwesi Appiah','Adjoa Asante',
          'Yaw Darko','Abena Osei','Kojo Frimpong','Akosua Amoah','Kwabena Antwi']::text[] as cro_names,
    array['Adenta','Kaneshie','Tema Community 5','Kumasi Asokwa','Sunyani Estate',
          'Takoradi Market Circle','Ho Bankoe','Tamale Aboabo','Cape Coast Pedu',
          'Koforidua Adweso','Wa Kambali','Damongo','Bolgatanga SSNIT Flats','Techiman']::text[] as locations,
    array['024','020','054','055','059','026','027','050']::text[] as phone_prefixes,
    array['Very satisfied with the follow-up call and clear explanation of medication schedule.',
          'Appreciated the reminder — made it to the clinic on time as a result.',
          'Pleased with how quickly the CRO responded to the enquiry.',
          'Grateful for the recovery monitoring check-in after discharge.',
          'Happy with the SMS reminder service, found it very convenient.']::text[] as positive_narratives,
    array['Waited too long for a call back after leaving a message.',
          'Medication was not available at the pharmacy as promised.',
          'Felt the explanation given over the phone was rushed and unclear.',
          'Appointment was rescheduled without adequate notice.',
          'Difficulty reaching the clinic through the listed contact number.']::text[] as complaint_narratives,
    array['Suggested adding a local-language option for SMS reminders.',
          'Recommended earlier reminder calls, a day before the appointment.',
          'Asked for a dedicated line for prescription refill enquiries.',
          'Proposed WhatsApp as an additional reminder channel.',
          'Suggested extending call centre hours into the evening.']::text[] as suggestion_narratives,
    array['No particular concerns raised during the call.',
          'Routine check-in, patient had nothing further to add.',
          'Call completed without incident, general wellbeing confirmed.',
          'Standard follow-up, patient status unchanged since last contact.',
          'Brief call, patient declined to elaborate further.']::text[] as neutral_narratives,
    array['Patients often unaware of which SSNIT-affiliated pharmacy is closest to them.',
          'Several pensioners report difficulty affording transport to the hospital.',
          'Recurring confusion between appointment reminder and recovery monitoring calls.',
          'Elderly patients frequently need family members present to receive instructions.',
          'Contact numbers on file are often outdated, requiring alternative contacts.',
          'Positive reception noted whenever CRO follows up in the local language.',
          'Patients tend to trust SMS reminders more when sent the evening before.',
          'Rural patients report weaker network coverage affecting call quality.']::text[] as observations,
    array['Contact details on record were outdated or incorrect.',
          'Clinic appointment slot was overbooked for that time window.',
          'Pharmacy stock-out delayed medication pickup.',
          'CRO caseload for the week exceeded available call time.',
          'Patient did not understand the earlier instructions given.',
          'Network/connectivity issues disrupted the call.',
          'Transport cost was a barrier to attending the appointment.',
          'Family caregiver was unavailable to assist the pensioner.']::text[] as root_causes,
    array['Rising number of pensioners requesting local-language support.',
          'Growing preference for SMS over phone calls among younger pensioners.',
          'Increasing complaints about pharmacy stock availability.',
          'More patients asking about transport support to appointments.',
          'Noticeable uptick in recovery monitoring enquiries post-discharge.',
          'Pattern of missed calls during market days in rural districts.',
          'Increasing requests for evening call slots.',
          'Recurring interest in a WhatsApp-based reminder channel.']::text[] as emerging_trends,
    array['Introduce a local-language script for CROs handling reminder calls.',
          'Add a second SMS reminder sent the evening before the appointment.',
          'Coordinate with pharmacy unit to flag low-stock medications earlier.',
          'Extend call centre hours to cover early evening slots.',
          'Provide a transport subsidy list for high-need rural pensioners.',
          'Pilot WhatsApp reminders alongside SMS for a subset of patients.',
          'Refresh contact details annually during the January data entry cycle.',
          'Route recovery monitoring calls to CROs with clinical follow-up training.']::text[] as recommendations
),
ssnit_pool as (
  select
    n,
    chr(65 + (n % 26)) || lpad(n::text, 12, '0') as ssnit_number
  from generate_series(1, 180) as n
),
gen0 as (
  select
    n,
    (date '2026-01-01' + floor(random() * 212)::int) as interaction_date,
    1 + floor(random() * 180)::int as ssnit_pick,
    a.region_ids[1 + floor(random() * array_length(a.region_ids, 1))::int] as region_id,
    a.engagement_ids[1 + floor(random() * array_length(a.engagement_ids, 1))::int] as engagement_type_id,
    a.channel_ids[1 + floor(random() * array_length(a.channel_ids, 1))::int] as digital_channel_id,
    a.priority_ids[1 + floor(random() * array_length(a.priority_ids, 1))::int] as priority_level_id,
    a.unit_ids[1 + floor(random() * array_length(a.unit_ids, 1))::int] as responsible_unit_id,
    a.status_ids[1 + floor(random() * array_length(a.status_ids, 1))::int] as status_id,
    a.cro_names[1 + floor(random() * array_length(a.cro_names, 1))::int] as cro_name,
    a.locations[1 + floor(random() * array_length(a.locations, 1))::int] as physical_location,
    case
      when random() < 0.10 then null
      when random() < 0.08 then lpad(floor(random() * 900000 + 100000)::text, 6, '0')
      else a.phone_prefixes[1 + floor(random() * array_length(a.phone_prefixes, 1))::int]
           || lpad(floor(random() * 10000000)::text, 7, '0')
    end as telephone_number,
    case when random() < 0.25
      then a.phone_prefixes[1 + floor(random() * array_length(a.phone_prefixes, 1))::int]
           || lpad(floor(random() * 10000000)::text, 7, '0')
      else null
    end as alternative_contact_number,
    case when random() < 0.20 then 'pensioner' || n || '@example.com' else null end as email_address,
    (random() < 0.85) as successful_contact,
    (random() < 0.75) as issue_resolved,
    (random() < 0.12) as escalation_required,
    (random() < 0.70) as has_observation,
    (random() < 0.45) as has_emerging_trend,
    (random() < 0.45) as has_recommendation,
    a.observations[1 + floor(random() * array_length(a.observations, 1))::int] as observation_pick,
    a.root_causes[1 + floor(random() * array_length(a.root_causes, 1))::int] as root_cause_pick,
    a.emerging_trends[1 + floor(random() * array_length(a.emerging_trends, 1))::int] as trend_pick,
    a.recommendations[1 + floor(random() * array_length(a.recommendations, 1))::int] as recommendation_pick,
    a.positive_narratives[1 + floor(random() * array_length(a.positive_narratives, 1))::int] as positive_pick,
    a.complaint_narratives[1 + floor(random() * array_length(a.complaint_narratives, 1))::int] as complaint_pick,
    a.suggestion_narratives[1 + floor(random() * array_length(a.suggestion_narratives, 1))::int] as suggestion_pick,
    a.neutral_narratives[1 + floor(random() * array_length(a.neutral_narratives, 1))::int] as neutral_pick
  from generate_series(1, 520) as n
  cross join arrays a
),
gen as (
  select g0.*, sp.ssnit_number
  from gen0 g0
  join ssnit_pool sp on sp.n = g0.ssnit_pick
),
gen2 as (
  select
    g.*,
    rp.id as reporting_period_id,
    wc.id as weekly_cycle_id,
    fc.id as feedback_category_id,
    fc.label as feedback_category_label
  from gen g
  join public.reporting_periods rp on rp.label = to_char(g.interaction_date, 'Mon YYYY')
  join public.weekly_cycles wc on wc.label = 'Week ' || least(5, ((extract(day from g.interaction_date)::int - 1) / 7) + 1)
  cross join lateral (
    select id, label from public.feedback_categories order by id
    offset floor(random() * (select count(*) from public.feedback_categories))::int limit 1
  ) fc
)
insert into public.telemedicine_entries (
  institution_id, reporting_period_id, weekly_cycle_id, date_of_interaction, cro_name,
  ssnit_number, telephone_number, alternative_contact_number, email_address, physical_location,
  region_id, engagement_type_id, digital_channel_id, feedback_category_id, detailed_feedback_narrative,
  successful_contact, issue_resolved, escalation_required,
  key_observation, root_cause, emerging_trend, recommendation,
  priority_level_id, responsible_unit_id, status_id
)
select
  hospital.id,
  g2.reporting_period_id,
  g2.weekly_cycle_id,
  g2.interaction_date,
  g2.cro_name,
  g2.ssnit_number,
  g2.telephone_number,
  g2.alternative_contact_number,
  g2.email_address,
  g2.physical_location,
  g2.region_id,
  g2.engagement_type_id,
  g2.digital_channel_id,
  g2.feedback_category_id,
  case g2.feedback_category_label
    when 'Positive' then g2.positive_pick
    when 'Complaint' then g2.complaint_pick
    when 'Suggestion' then g2.suggestion_pick
    else g2.neutral_pick
  end as detailed_feedback_narrative,
  g2.successful_contact,
  g2.issue_resolved,
  g2.escalation_required,
  case when g2.has_observation then g2.observation_pick end as key_observation,
  case when g2.escalation_required or g2.priority_level_id = (select id from public.priority_levels where label = 'High')
       then g2.root_cause_pick end as root_cause,
  case when g2.has_emerging_trend then g2.trend_pick end as emerging_trend,
  case when g2.has_recommendation
         and g2.feedback_category_label in ('Complaint', 'Suggestion')
       then g2.recommendation_pick end as recommendation,
  g2.priority_level_id,
  g2.responsible_unit_id,
  g2.status_id
from gen2 g2
cross join hospital;
