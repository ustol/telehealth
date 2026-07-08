# System Design — Telehealth Reporting System

Companion to `SYSTEM_REQUIREMENTS.md`. Describes the technical architecture: database schema, computed-field strategy, RPC contracts, RLS policy design, audit logging, and frontend structure.

## 1. Architecture Overview

```
React (Vite + TS) ──supabase-js──> Supabase (Postgres + Auth + RLS)
                                     ├── raw tables (telemedicine_entries, config lists, users/roles)
                                     ├── v_entries_computed (view: Excel-formula-derived columns)
                                     ├── RPC functions (weekly/monthly/quarterly/executive aggregates)
                                     └── audit triggers (fn_audit_row → audit_logs)
```

- **Frontend**: Vite + React 18 + TypeScript (strict) + Tailwind CSS + shadcn/ui + React Hook Form + Zod + TanStack Query + TanStack Table + Recharts + jsPDF/jspdf-autotable/html2canvas (PDF export) + SheetJS `xlsx` (Excel/CSV export).
- **Backend**: Supabase (Postgres, Auth, RLS, RPC). No separate application server — all business logic lives in Postgres (views + `SECURITY DEFINER` functions) so it's enforced regardless of client, and reused identically by every page.
- **Why views instead of triggers for computed columns**: `duplicate_flag`, `quarter`, the sort keys, etc. are set-wide comparisons — Excel's `COUNTIFS` scans the *whole table* live on every recalculation. A trigger fired on row A's insert cannot retroactively know about row B inserted afterward; keeping these correct via triggers would require re-scanning and rewriting sibling rows on every write (drift risk, extra write amplification). A SQL view recomputes on every read using window functions, which is both simpler and exactly mirrors Excel's always-live-recalc behavior. Only `entry_id` is a real stored column, because Excel treats it as a permanent identity assigned once, not a recalculated value.

## 2. Database Schema

### 2.1 Config / Lookup Tables

All ten share this shape (System Admin write access only, readable by all authenticated users):

```sql
create table public.<config_table> (
  id serial primary key,
  label text not null unique,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

Tables: `reporting_periods`, `weekly_cycles`, `engagement_types`, `digital_channels`, `feedback_categories`, `priority_levels`, `statuses`, `regions`, `responsible_units`, `platforms`.

`yes_no` is not a table — booleans are used natively in Postgres for the Yes/No fields (`successful_contact`, `issue_resolved`, `escalation_required`); the UI still renders them as Yes/No selects to match the workbook.

### 2.2 Identity / Access Tables

- `institutions (id uuid pk, name text unique, type text check in ('hospital','ssnit','system'), created_at)`
- `profiles (id uuid pk references auth.users, institution_id fk, full_name text, email text, is_active bool default true, created_at, updated_at)`
- `roles (id serial pk, name text unique check in (6 role names))`
- `user_roles (id serial pk, user_id fk profiles, role_id fk roles, institution_id fk institutions null, unique(user_id, role_id))`

### 2.3 `telemedicine_entries` (raw input only)

```
id uuid pk default uuid_generate_v4()
entry_id text unique not null            -- 'TTH-0001', assigned via sequence at insert
institution_id uuid not null fk institutions
reporting_period_id int fk reporting_periods
weekly_cycle_id int fk weekly_cycles
date_of_interaction date not null
cro_name text
ssnit_number text not null                -- check (ssnit_number ~ '^[A-Z][0-9]{12}$')
telephone_number text
alternative_contact_number text
email_address text
physical_location text
region_id int fk regions
engagement_type_id int fk engagement_types
digital_channel_id int fk digital_channels
feedback_category_id int fk feedback_categories
detailed_feedback_narrative text
successful_contact boolean
issue_resolved boolean
escalation_required boolean
key_observation text
root_cause text
emerging_trend text
recommendation text
priority_level_id int fk priority_levels
responsible_unit_id int fk responsible_units
status_id int fk statuses
is_deleted boolean not null default false   -- soft delete, Admin-only
created_by uuid fk profiles
updated_by uuid fk profiles
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

`entry_id` sequence: `create sequence entry_id_seq;` then `default ('TTH-' || lpad(nextval('entry_id_seq')::text, 4, '0'))`.

### 2.4 `v_entries_computed` (derived view)

Joins `telemedicine_entries` to every config table (for human-readable labels) and adds, via window functions over the full (non-deleted) row set:

- `positive_feedback/complaint/suggestion` — `case when feedback_category = 'Positive' then 'Yes' else 'No' end`, etc.
- `quarter` — `'Q' || ceil(extract(month from date_of_interaction)/3.0) || ' ' || extract(year from date_of_interaction)`
- `duplicate_flag` — `case when count(*) over (partition by ssnit_number) > 1 then 'DUPLICATE' else null end`
- `contact_missing` — `case when coalesce(telephone_number,'')='' and coalesce(alternative_contact_number,'')='' and coalesce(email_address,'')='' then 'MISSING CONTACT' else null end`
- `phone_check` — `case when length(regexp_replace(coalesce(telephone_number,''), '[ +\-]', '', 'g')) < 10 then 'CHECK NUMBER' else null end`
- `recommendation_sort_key` — within `row_number() over (partition by recommendation order by date_of_interaction, entry_id) = 1` (and `recommendation` non-empty): `(case priority_level when 'High' then 3 when 'Medium' then 2 else 1 end) * 1000000 + extract(epoch from date_of_interaction)::bigint`
- `observation_sort_key` — same first-occurrence pattern on `key_observation`, value = date epoch only (recency).
- `risk_sort_key` — first occurrence of `root_cause` (non-empty) where `escalation_required OR priority_level='High'`, value = date epoch.
- `opportunity_sort_key` — first occurrence of `emerging_trend` (non-empty) where `suggestion='Yes' OR emerging_trend<>''`, value = date epoch.

This view is `security_invoker = true` so RLS on the base table still applies to whoever queries it.

### 2.5 `report_snapshots`

```
id uuid pk, report_type text check in ('weekly','monthly','quarterly','executive'),
period_label text, generated_by uuid fk profiles, generated_at timestamptz default now(),
export_format text check in ('pdf','excel','csv',null), params jsonb
```

### 2.6 `audit_logs`

```
id uuid pk, actor_id uuid fk profiles, action text, table_name text, record_id text,
old_data jsonb, new_data jsonb, event_type text check in ('crud','login','logout','export','view'),
created_at timestamptz default now()
```

## 3. RPC Functions

All `SECURITY DEFINER`, granted to `authenticated`. Each does its own role check internally (via `has_role()`) before returning data, so RLS-bypassing aggregation (e.g. SSNIT viewing all institutions) is intentional and contained to these functions, not a blanket bypass.

- **`get_weekly_summary(p_period_id int, p_cycle_id int)`** → `jsonb`. Filters `telemedicine_entries` to the given period+cycle in a CTE, computes counts (patients contacted, follow-up activities, feedback collected, complaints, issues resolved), feedback-category breakdown, and Top 3 Observations/Recommendations using `row_number()`/`rank()` **recomputed within the filtered CTE** (not read from `v_entries_computed`, since that view's sort keys are global-scope, not period-scoped — this is the one place ranking must be scoped to the filtered subset, matching the workbook's Calc-sheet helper columns).
- **`get_monthly_consolidation(p_year int)`** → `jsonb`. `GROUP BY` month across `reporting_periods` for the 6 metrics, Jan–Dec + Year Total. Top 5 lists pulled from `v_entries_computed` global sort keys (unfiltered by year, matching the workbook).
- **`get_quarterly_consolidation(p_year int)`** → `jsonb`. Sums the monthly RPC's output into Q1–Q4 + Year Total, computes Busiest Month/Quarter and Months With Activity, and returns the same three global Top-5 lists relabeled for this page.
- **`get_executive_dashboard(p_year int default null)`** → `jsonb`. 6 KPI totals (optionally year-filtered), 6 monthly chart series, a 15×4 region-by-quarter matrix (from the live `regions` table, zero-filled for regions with no entries), and the 4 global Top-5 insight panels.

## 4. RLS Design

Helper functions:

```sql
create function has_role(p_role text) returns boolean security definer as $$
  select exists (
    select 1 from user_roles ur join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.name = p_role
  );
$$ language sql stable;

create function user_institution_id() returns uuid security definer as $$
  select institution_id from profiles where id = auth.uid();
$$ language sql stable;
```

- **`telemedicine_entries`**: SELECT — Trust Hospital roles + System Admin restricted to `institution_id = user_institution_id()`; SSNIT Viewer / SSNIT Executive Viewer see all rows (read-only by omission of write policies). INSERT/UPDATE — Trust Hospital Data Entry Officer + Trust Hospital Admin, `with check (institution_id = user_institution_id())`; Trust Hospital Reviewer may UPDATE only `status`/review-related columns (enforced via a dedicated `review_entry()` RPC rather than a blanket UPDATE policy, since column-level RLS isn't native). DELETE — no hard-delete policy at all; soft delete via UPDATE `is_deleted=true`, System Admin/Trust Hospital Admin only.
- **Config tables**: SELECT for all `authenticated`; INSERT/UPDATE/DELETE only `has_role('System Admin')`.
- **`profiles` / `user_roles`**: users can SELECT their own row; all writes and cross-user SELECT require `has_role('System Admin')`.
- **`report_snapshots`**: INSERT by any authenticated role with report access; SELECT scoped like entries (institution-based for hospital roles, unrestricted for SSNIT/Admin).
- **`audit_logs`**: SELECT restricted to System Admin (and Trust Hospital Admin, filtered to actors within their own institution); no client INSERT policy exists at all — the only writers are the audit trigger function and a locked-down `log_client_event()` RPC used for login/export/view events.

## 5. Audit Logging

- **Trigger-based** (reliable, can't be bypassed by client code): a single generic `fn_audit_row()` attached `AFTER INSERT OR UPDATE OR DELETE` on `telemedicine_entries`, `user_roles`, and every config table. Uses `TG_OP`, `to_jsonb(OLD)`, `to_jsonb(NEW)`, and `auth.uid()` as actor.
- **Client-side** (`log_client_event()` RPC, insert-only) for events with no row mutation: login, logout, PDF/Excel/CSV export, report/dashboard view. Called from a small `writeAudit()` helper in `src/lib/audit.ts`.

## 6. Frontend Structure

```
src/
  lib/
    supabase.ts        Supabase client, reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
    roles.ts            role name constants + permission-check helpers
    audit.ts            writeAudit() client-event logger
    phone.ts            phone cleaning/validation (mirrors phone_check formula)
    utils.ts            cn() and misc helpers
  hooks/
    useAuth.ts, useConfigLists.ts, useEntries.ts,
    useWeeklySummary.ts, useMonthlyConsolidation.ts, useQuarterlyConsolidation.ts,
    useExecutiveDashboard.ts, useAuditLogs.ts, useUsers.ts
  components/
    ui/*                shadcn primitives
    layout/{AppShell, Sidebar}
    entries/{EntryForm, EntryTable, EntryFilters}
    dashboard/{KpiCard, RegionHeatmap, TopNPanel}
    charts/*             recharts wrappers (per dataviz conventions)
    export/{PdfExportButton, ExcelExportButton, CsvExportButton}
  pages/
    auth/Login.tsx
    dashboard/DashboardHome.tsx
    entries/WeeklyDataEntry.tsx
    reports/{WeeklySummary,MonthlyConsolidation,QuarterlyConsolidation,ExecutiveDashboard,ReportsExport}.tsx
    admin/{Configuration,UserManagement,AuditLogs}.tsx
  routes/{RequireAuth.tsx, RequireRole.tsx, routes.tsx}
  types/{database.ts, domain.ts}
supabase/{schema.sql, seed.sql}
```

- **Auth**: `useAuth()` hook wraps `supabase.auth` session + a `profiles`/`user_roles` join, exposed via context so any component can read `{ user, roles, institution, loading }`.
- **Route guarding**: `<RequireAuth>` (session required) and `<RequireRole allow={[...]}>` (role required) wrap route elements in `routes.tsx`. These are UX-layer guards only — RLS is the real enforcement, so a guard bypass never exposes data.
- **Forms**: React Hook Form + Zod schemas per entity; entry form's Zod schema encodes the validation rules from `SYSTEM_REQUIREMENTS.md` §8 (patient name required, at least one contact field, conditional priority requirement, etc.).
- **Grids**: TanStack Table for the entries grid (sorting, column filters, pagination) and for Audit Logs / User Management tables.
- **Charts**: Recharts — line (monthly trend), bar (activities/complaints by month, engagement-type breakdown), pie/donut (feedback category), and a custom heatmap grid component (region × quarter) since Recharts has no native heatmap.
- **Exports**: PDF via `jspdf` + `jspdf-autotable` (tabular reports) with `html2canvas` for chart snapshots where needed; Excel/CSV via `xlsx`. Every export call writes a `report_snapshots` row and an audit `export` event.

## 7. Environment Variables

`.env` (git-ignored) / `.env.example` (committed):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

No service-role key is ever used client-side; all privileged aggregation happens through `SECURITY DEFINER` RPCs, not an elevated client key.
