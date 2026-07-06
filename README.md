# Telehealth Reporting System

A joint telemedicine reporting platform between **The Trust Hospital** and **SSNIT**, replacing the manual `Telehealth REPORT Approved.xlsx` workbook with a React + Supabase web application. See [`SYSTEM_REQUIREMENTS.md`](./SYSTEM_REQUIREMENTS.md) and [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) for the full requirements and technical design.

## Stack

Vite + React 18 + TypeScript (strict) + Tailwind CSS + shadcn/ui-style components + React Hook Form + Zod + TanStack Query + TanStack Table + Recharts + jsPDF/xlsx exports, backed by Supabase (Postgres + Auth + Row Level Security).

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com) (or use an existing one).
2. Open the SQL Editor and run, in order:
   - `supabase/schema.sql` — tables, the computed-fields view, RPC functions, triggers, and RLS policies.
   - `supabase/seed.sql` — configuration list values (reporting periods, regions, engagement types, etc.).
3. In **Project Settings → API**, copy the **Project URL** and **anon public key**.
4. In **Authentication → Providers**, make sure Email sign-in is enabled.

### Creating your first users

User accounts are provisioned by a System Admin, not via public self-registration:

1. In **Authentication → Users**, click **Add user** (or **Invite**) to create an account for each staff member.
2. Signing up automatically creates a matching row in `public.profiles` (via the `handle_new_user` trigger), but with no institution or role yet.
3. Log in to the app once as any user, then use the SQL Editor to promote your first System Admin so you can use the in-app **User Management** page for everyone else:

   ```sql
   insert into public.user_roles (user_id, role_id)
   select id, (select id from public.roles where name = 'System Admin')
   from public.profiles where email = 'your.admin@email.com';

   update public.profiles
   set institution_id = (select id from public.institutions where name = 'System')
   where email = 'your.admin@email.com';
   ```

4. From then on, System Admin can assign institutions and roles to every other user from **User Management** in the app.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 3. Run locally

```bash
npm install
npm run dev
```

Visit the printed local URL and sign in.

## 4. Build & typecheck

```bash
npm run typecheck
npm run build
```

## Roles

| Role | Access |
|---|---|
| Trust Hospital Admin | Full CRUD on own institution's entries, all reports, soft-delete |
| Trust Hospital Data Entry Officer | Create/edit own institution's entries, all reports |
| Trust Hospital Reviewer | Review entry status, all reports |
| SSNIT Viewer | Read-only reports/dashboards |
| SSNIT Executive Viewer | Read-only reports/dashboards, exports |
| System Admin | Users, roles, configuration lists, audit logs |

## Notes

- All Excel-formula-equivalent fields (entry ID sequencing aside) are computed live in the `v_entries_computed` Postgres view — nothing is cached or trigger-maintained, so they're always in sync with the underlying data, mirroring the workbook's live recalculation.
- Known, deliberate discrepancies from the source workbook (stale legacy rows the app does **not** reproduce) are documented in `SYSTEM_REQUIREMENTS.md` §10.
- `npm audit` flags known advisories in `xlsx` (no fix available upstream), `dompurify` via `jspdf`/`jspdf-autotable` (fixable by upgrading to `jspdf@4`, which is a breaking change not applied here), and `esbuild` via `vite` (dev-server only, not a production runtime risk). The `xlsx`/`dompurify` advisories concern *parsing untrusted input*; this app only ever generates exports from its own already-loaded, RLS-scoped data — it never parses an uploaded spreadsheet or untrusted HTML — which meaningfully narrows the exploitable surface, but re-run `npm audit` before a production deploy to pick up newer patched releases.
