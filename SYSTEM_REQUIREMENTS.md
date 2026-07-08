# System Requirements — Telehealth Reporting System

Joint reporting platform between **The Trust Hospital** and **SSNIT** (Social Security and National Insurance Trust, Ghana) for telemedicine outreach to SSNIT pensioners.

This document is derived from the approved reference workbook `Telehealth REPORT Approved.xlsx` (sheets: Weekly Data Entry, Weekly Summary, Monthly Consolidation, Quarterly Consolidation, Executive Dashboard, Lists, Calc). Every rule below traces to a formula, data validation, or named range observed directly in that workbook — nothing here is fabricated. Where the app's behavior deliberately diverges from a workbook artifact (because that artifact was a legacy/test inconsistency rather than approved logic), it is called out explicitly under **Known Workbook Discrepancies**.

## 1. Purpose

Replace the manual Excel workflow with a multi-user web application where:
- The Trust Hospital captures telemedicine interaction records for SSNIT pensioners.
- SSNIT views read-only dashboards, reports, summaries, and exports.
- Reporting rolls up automatically: **Weekly Data Entry → Weekly Summary → Monthly Consolidation → Quarterly Consolidation → Executive Dashboard**, reproducing the workbook's exact formula logic.

## 2. System Users / Roles

| Role | Institution | Access |
|---|---|---|
| Trust Hospital Admin | Trust Hospital | Full CRUD on own institution's entries, views all reports, manages own institution's data |
| Trust Hospital Data Entry Officer | Trust Hospital | Create/edit own institution's entries, views reports |
| Trust Hospital Reviewer | Trust Hospital | Review/update entry status and review fields on own institution's entries, views reports |
| SSNIT Viewer | SSNIT | Read-only: reports, summaries, dashboards |
| SSNIT Executive Viewer | SSNIT | Read-only: Executive Dashboard, all reports, exports |
| System Admin | System | Manage users, roles, configuration lists, permissions; full audit log access |

SSNIT users can never edit hospital data unless a System Admin explicitly changes their role/permissions.

## 3. Core Workflow

1. Trust Hospital staff log in and enter telemedicine interaction records for SSNIT pensioners via **Weekly Data Entry**.
2. The system auto-computes: entry ID, reporting quarter, duplicate flag, missing-contact warning, phone-number check, and four ranking sort keys (recommendation, observation, risk, opportunity).
3. Weekly entries roll up into **Weekly Summary** (filtered view), then aggregate into **Monthly Consolidation**, **Quarterly Consolidation**, and the **Executive Dashboard**.
4. SSNIT logs in separately (same app, different role) and views reports/dashboards only — no edit access.

## 4. Data Model — `telemedicine_entries`

One row per patient interaction. Raw input fields (see `SYSTEM_DESIGN.md` for the full SQL schema and the derived/computed fields kept in a separate view):

entry_id, reporting_period, weekly_cycle, date_of_interaction, cro_name, ssnit_number, telephone_number, alternative_contact_number, email_address, physical_location, region, engagement_type, digital_channel_used, feedback_category, positive_feedback, complaint, suggestion, detailed_feedback_narrative, successful_contact, issue_resolved, escalation_required, key_observation, root_cause, emerging_trend, recommendation, priority_level, responsible_unit, status, quarter, duplicate_flag, contact_missing, phone_check, recommendation_sort_key, observation_sort_key, risk_sort_key, opportunity_sort_key, created_by, updated_by, created_at, updated_at.

> **Patient identification note**: the workbook's original `patient_full_name` field was replaced with `ssnit_number` (the pensioner's SSNIT number) as the patient identifier — required, exactly 13 characters, a capital letter followed by 12 digits (`^[A-Z][0-9]{12}$`). This is a deliberate deviation from the source workbook, made after go-live at the user's request, since the SSNIT number is a stronger and more privacy-conscious unique identifier than a free-text name.

## 5. Configuration / Dropdown Lists

Editable by System Admin only, sourced from the workbook's Lists sheet (each is a live, growable list, mirroring Excel's dynamic named ranges):

- **reporting_periods**: Jan 2026 – Dec 2026
- **weekly_cycles**: Week 1 – Week 5
- **engagement_types**: Appointment Reminder Call, SMS Reminder, Follow-Up Call, Recovery Monitoring, Enquiries, Feedback Collection, Complaint Resolution, Other
- **digital_channels**: Phone Call, SMS
- **yes_no**: Yes, No
- **feedback_categories**: Positive, Complaint, Suggestion, Neutral
- **priority_levels**: High, Medium, Low
- **statuses**: Open, In Progress, Closed
- **regions**: Ahafo, Ashanti, Bono, Bono East, Central, Eastern, Northern, North East, Oti, Savannah, Upper East, Upper West, Volta, Western, Western North (15 current Ghana regions)
- **responsible_units**: Telehealth Unit, Call Centre, Clinical Team, IT / Digital, Patient Relations, Pharmacy, Records / Data
- **platforms**: SMS Gateway

## 6. Computed Field Logic (must match workbook formulas exactly)

- **entry_id**: sequential `TTH-0001`, `TTH-0002`, … assigned permanently at creation.
- **positive_feedback / complaint / suggestion**: `Yes` when `feedback_category` equals Positive / Complaint / Suggestion respectively, else `No`.
- **quarter**: `"Q" & ROUNDUP(MONTH/3) & " " & YEAR` → e.g. `"Q2 2026"` (quarter **and** year combined, not just "Q2").
- **duplicate_flag**: `DUPLICATE` when the same `ssnit_number` appears in more than one row.
- **contact_missing**: `MISSING CONTACT` when telephone, alternative contact, and email are all empty.
- **phone_check**: `CHECK NUMBER` when the telephone number, stripped of spaces/dashes/plus signs, has fewer than 10 digits.
- **recommendation_sort_key**: set only on the *first* row where a given `recommendation` text occurs; value ranks by priority (High=3, Medium=2, Low=1) first, then by recency. Duplicate occurrences of the same text get no sort key, so "Top N Recommendations" lists never repeat the same text.
- **observation_sort_key**: same first-occurrence-only pattern for `key_observation`, ranked by recency only.
- **risk_sort_key**: set only when (`escalation_required = Yes` OR `priority_level = High`) AND `root_cause` is non-empty AND it's the first occurrence of that root cause text.
- **opportunity_sort_key**: set only when (`suggestion = Yes` OR `emerging_trend` is non-empty) AND it's the first occurrence of that trend text.
- **Top-N logic** (used throughout Weekly/Monthly/Quarterly/Executive pages): order by the relevant sort key descending, take the top N — because only first occurrences carry a sort key, this naturally deduplicates repeated text.

## 7. Application Pages

1. **Login** — Supabase Auth, role-aware redirect.
2. **Dashboard landing** — role-appropriate summary/links.
3. **Weekly Data Entry** — form + grid, Trust Hospital roles only (write); read-only for other roles.
4. **Weekly Summary** — filtered by reporting period + weekly cycle.
5. **Monthly Consolidation** — Jan–Dec + Year Total.
6. **Quarterly Consolidation** — Q1–Q4 + Year Total, annual trends.
7. **Executive Dashboard** — KPI cards, charts, region heatmap, insight panels.
8. **Reports Export** — filter + export to PDF/Excel/CSV.
9. **Lists / Configuration** — System Admin manages dropdown lists.
10. **User Management** — System Admin manages users/roles.
11. **Audit Logs** — System Admin (and institution-scoped Trust Hospital Admin) view of all sensitive actions.

### 7.1 Weekly Summary Requirements
Total Patients Contacted, Total Follow-Up Activities, Total Feedback Collected, Total Complaints, Total Issues Resolved; Positive/Complaints/Suggestions/Neutral breakdown; Top 3 Observations; Top 3 Recommendations — all scoped to the selected reporting period + weekly cycle.

### 7.2 Monthly Consolidation Requirements
Jan–Dec + Year Total for: Total Patients Contacted, Total Follow-Up Activities, Total Feedback Records, Total Complaints, Total Issues Resolved, Total Escalations. Global (unfiltered) Top 5 Key Observations, Top 5 Recommendations, Top 5 Risk Areas, Top 5 Opportunities.

### 7.3 Quarterly Consolidation Requirements
Q1–Q4 + Year Total for the same 6 metrics (summed from monthly). Busiest Month, Busiest Quarter, Months With Activity. Global Top 5 Emerging Trends, Top 5 Major Service Concerns, Top 5 Key Recommendations for Management.

### 7.4 Executive Dashboard Requirements
KPI cards: Total Patients Contacted, Total Follow-Up Activities, Total Complaints, Issues Resolved, Open Issues, Closed Issues. Charts: monthly patient engagement trend, follow-up activities by month, complaints by month, engagement-type breakdown, feedback-category breakdown, patient engagement by region heatmap (15 regions × 4 quarters). Insight panels: Top 5 Observations, Top 5 Risks, Top 5 Recommendations, Top 5 Opportunities.

### 7.5 Reports & Export
Filter by date range, reporting period, week, month, quarter, region, status, responsible unit, feedback category, priority. Export to PDF, Excel, CSV. Branded as a joint SSNIT / The Trust Hospital telemedicine reporting system.

## 8. Validation Rules

- SSNIT Number is required, exactly 13 characters: a capital letter followed by 12 digits.
- At least one contact field (telephone, alternative contact, email) required unless deliberately marked unavailable.
- Reporting period, weekly cycle, date of interaction, region, engagement type, feedback category, and status are required.
- Priority level required when complaint, escalation, risk, or recommendation is present.
- Phone numbers are cleaned (strip spaces/dashes/plus) and validated against the 10-digit check.
- Duplicate warnings are shown before saving but **do not** block submission.

## 9. Security Requirements

- Supabase Auth for authentication; Row Level Security (RLS) on every table.
- Trust Hospital users can create/edit only their own institution's entries.
- SSNIT users are read-only on all entries and reports.
- System Admin manages users, roles, configuration lists, and permissions.
- Every create, update, delete, login, export, and report view is written to `audit_logs`.
- No public patient portal; no payment functionality; no clinical diagnosis modules.
- Environment variables hold all Supabase credentials; no secrets hard-coded.

## 10. Known Workbook Discrepancies (documented decisions, not oversights)

- The Executive Dashboard's region heatmap and two engagement-type charts read from stale hardcoded rows on the workbook's `Calc` sheet (including a legacy **"Greater Accra"** region not in the current 15-region list, and missing 6 current regions; a legacy **"Telemedicine Follow-Up"** engagement type not in the current 8-type list, missing "Enquiries"). The app drives these visuals from the live `regions` / `engagement_types` configuration tables instead of reproducing the stale rows.
- The workbook's `digital_channels` named range officially lists only **Phone Call** and **SMS**; several sample rows contain "Email", "WhatsApp", "Telemedicine Platform" — these are pre-approval test artifacts entered before the dropdown was finalized, not part of the approved list, and are not seeded as configuration values.
- The workbook's `weekly_cycles` named range officially lists **Week 1–Week 5**; one sample row contains "Week 6" (a data-entry anomaly, not a real 6th cycle) and is not added to configuration.
- Monthly/Quarterly "Top 5" panels and the Executive Dashboard's insight panels are **global and unfiltered** in the workbook (the underlying formulas reference the entire entry table, not the displayed period) — the app reproduces this faithfully rather than re-scoping them per month/quarter, since that is the approved behavior, not a bug.

## 11. Non-Goals

- No public patient portal.
- No payment functionality.
- No clinical diagnosis modules.
- No fields beyond what the workbook supports, unless explicitly marked optional/system-generated (e.g. audit timestamps).
