-- ============================================================================
-- Telehealth Reporting System — configuration list seed data
-- Run once after schema.sql. Values sourced from the workbook's "Lists" sheet
-- (see SYSTEM_REQUIREMENTS.md §5 / §10 for the discrepancy notes on what was
-- deliberately NOT carried over from stale/legacy workbook rows).
-- ============================================================================

insert into public.reporting_periods (label, sort_order) values
  ('Jan 2026', 1), ('Feb 2026', 2), ('Mar 2026', 3), ('Apr 2026', 4),
  ('May 2026', 5), ('Jun 2026', 6), ('Jul 2026', 7), ('Aug 2026', 8),
  ('Sep 2026', 9), ('Oct 2026', 10), ('Nov 2026', 11), ('Dec 2026', 12);

insert into public.weekly_cycles (label, sort_order) values
  ('Week 1', 1), ('Week 2', 2), ('Week 3', 3), ('Week 4', 4), ('Week 5', 5);

insert into public.engagement_types (label, sort_order) values
  ('Appointment Reminder Call', 1),
  ('SMS Reminder', 2),
  ('Follow-Up Call', 3),
  ('Recovery Monitoring', 4),
  ('Enquiries', 5),
  ('Feedback Collection', 6),
  ('Complaint Resolution', 7),
  ('Other', 8);

insert into public.digital_channels (label, sort_order) values
  ('Phone Call', 1), ('SMS', 2);

insert into public.feedback_categories (label, sort_order) values
  ('Positive', 1), ('Complaint', 2), ('Suggestion', 3), ('Neutral', 4);

insert into public.priority_levels (label, sort_order) values
  ('High', 1), ('Medium', 2), ('Low', 3);

insert into public.statuses (label, sort_order) values
  ('Open', 1), ('In Progress', 2), ('Closed', 3);

insert into public.regions (label, sort_order) values
  ('Ahafo', 1), ('Ashanti', 2), ('Bono', 3), ('Bono East', 4), ('Central', 5),
  ('Eastern', 6), ('Northern', 7), ('North East', 8), ('Oti', 9),
  ('Savannah', 10), ('Upper East', 11), ('Upper West', 12), ('Volta', 13),
  ('Western', 14), ('Western North', 15);

insert into public.responsible_units (label, sort_order) values
  ('Telehealth Unit', 1), ('Call Centre', 2), ('Clinical Team', 3),
  ('IT / Digital', 4), ('Patient Relations', 5), ('Pharmacy', 6),
  ('Records / Data', 7);

insert into public.platforms (label, sort_order) values
  ('SMS Gateway', 1);
