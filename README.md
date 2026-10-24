# Wasl CRM | وصل — Functional React + Supabase CRM

Arabic-first CRM with real persistence, authentication, customers, sales opportunities, follow-up tasks, appointments, business statistics, and a clean responsive dashboard.

> **Not hosted or live by default.** You need your own Supabase project, environment variables, and database migration. Never use the Supabase service-role key in this browser app.

## 1. What is implemented

| Module | Implementation |
|---|---|
| Authentication | Sign up, sign in, sign out, reset/update password using Supabase Auth |
| Customer management | Create, edit, archive/restore, search, filter, details, WhatsApp deep links |
| Activity log | Save customer notes as activity records |
| Pipeline | Create, update, delete sales opportunities, change stages |
| Tasks | Create, update, mark complete, filter by overdue/priority, delete |
| Appointments | Create, edit, cancel/status, delete, local time display |
| Dashboard | Real summary cards, sales stages, recent customers, upcoming tasks/appointments |
| Reports | Customers by source/status; deals by stage; won deals by separate currencies |
| Settings | Profile name, password update |
| Database security | RLS policies, explicit privileges, per-user ownership, cross-owner relational FKs |

## 2. Run on Replit (no Replit Agent needed)

1. Download and extract the ZIP and import the files into a **Node.js Replit** project, or import a GitHub repository containing these files.
2. Install dependencies using Replit Shell: `npm install`.
3. Create a free [Supabase project](https://supabase.com/dashboard). In its **SQL Editor**, paste and run **`supabase/migrations/202610240001_initial.sql`** exactly once, on a new empty project. Don't run this against a production database without reviewing it.
4. Find the Supabase **Project URL** and **publishable key** (or legacy anon key) under Project settings / API / Connect.
5. Add these as Replit **Secrets** (or `.env.local` if developing locally):
   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```
   Replit Secrets become environment variables. Vite embeds `VITE_` variables in the public browser bundle, so they **must never contain sensitive server credentials**.
6. In Supabase Authentication settings, configure **Site URL** and **Redirect URLs** to the Replit preview URL you actually use (also add a future production URL when available). Password recovery emails need a working redirect URL.
7. Start the application with `npm run dev`. The Vite dev server listens on `0.0.0.0:5173`.
8. Register a user. If email confirmation is enabled, confirm the email before logging in.
9. Log in and create your first customer. Data is stored in Supabase PostgreSQL, not localStorage.

If credentials are missing, the app intentionally displays a setup screen, not a fake CRM dashboard.

## 3. Local development

```bash
npm install
cp .env.example .env.local
# Enter the URL and publishable key
npm run dev
```

Build: `npm run build`; typecheck: `npm run typecheck`; utility tests: `npm test`.

## 4. Deploying affordably

For this architecture, the production frontend can be hosted as **static files** (build output `dist/`). It does not require an always-on Node.js server. Review current Replit deployment eligibility and billing before publishing, or host the static build on a free-tier-compatible static provider. On platforms requiring SPA routing rules, use the included `public/_redirects` file or equivalent fallback to `index.html`.

> **Cost warning:** The $20/month ceiling is a project goal, not an enforceable limit in code. Before deploying, manually inspect Replit usage caps, add-on settings, spending alerts, and Supabase service quotas. Do not enable billing upgrades or paid AI/messaging APIs. No code can guarantee a subscription or usage cap without provider-side settings.

## 5. SQL and security notes

- Tables: `profiles`, `customers`, `deals`, `tasks`, `appointments`, `activities`.
- Row Level Security for each table restricts users to their own records.
- Composite owner foreign keys protect linked customer/deal records from cross-account references.
- `public.handle_new_user()` automatically creates a profile at signup.
- Explicit grants avoid relying on permissive Supabase default table grants.
- Supabase Auth handles password hashing and session lifecycle.
- This MVP is **one workspace per account**. It is **not** a multi-tenant team permission system yet.
- Client-side queries currently cap list reads at 1,000 records per table; add pagination and server-side aggregates before larger production use.
- Security testing across two users and live database migration execution **must be performed in your Supabase account**.

## 6. Suggested test checklist

- [ ] User A signs up and signs in
- [ ] User A creates a customer; reloading the app retains data
- [ ] User A edits, archives, and restores the customer
- [ ] User A records an activity note in customer details
- [ ] User A creates a deal for that customer and marks it Won
- [ ] User A creates a task and checks it complete
- [ ] User A creates an appointment; the time displayed matches local timezone
- [ ] Dashboard and reports use the resulting values
- [ ] User B does **not** see user A's records
- [ ] Attempt to insert a deal referencing user A's customer as user B fails
- [ ] Reset password email reaches the registered address and redirect works
- [ ] Works on mobile widths and keyboard navigation

## 7. Known limitations of this MVP

- No automatic WhatsApp/Instagram sync; WhatsApp opens a standard chat link.
- No background reminders, SMS, or paid automation.
- Reports use client-side aggregations capped at 1,000 rows per table.
- No team roles, subscriptions, or multi-company tenancy.
- Customer record deletion uses archiving; deleting a linked deal/task/appointment is permanent.
- Activity log is manually entered.
- Live Supabase auth and RLS checks cannot be verified without a configured project.
- Development/build dependencies must be installed on an internet-connected Node runtime.

## 8. Folder map

- `src/auth` — auth context
- `src/components` — reusable UI and editors
- `src/layout` — navigation and dashboard shell
- `src/lib` — Supabase client, table operations, formatters
- `src/pages` — feature screens
- `src/styles` — responsive design
- `src/types` — domain model interfaces
- `supabase/migrations` — initial database migration
- `tests` — standalone utility tests

## 9. Before using with real customers

Review privacy requirements and secure access to patient, contact, and other personal information. Do not store highly sensitive medical data in this MVP. Configure email settings, backups and domain/HTTPS protections appropriate to production use. Verify Supabase database migration and RLS with two different test users before collecting real customer information.
