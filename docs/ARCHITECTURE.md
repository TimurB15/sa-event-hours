# SA Event Logistics architecture

## Audited baseline (2026-10-23)

Main at `03e223b` is a React/TypeScript/Vite/Tailwind single-device ledger. Reviewed App, all six pages, Layout, BottomNav, storage, store, types, branding, and QA-REPORT. It includes employee/customer CRUD, manual shifts, open jobs, reports and BOM CSV. Its original QA report incorrectly calls local claim operations atomic across devices; they are not. The deployed Pages site currently differs from main (a role-picker was observed). This branch does not change Pages deployment.

The original localStorage key `shiurei-ovdim-v1` is retained. No existing records are automatically migrated or erased. Malformed stored data stops loading and editing; the recovery screen offers its original bytes as a download. Claiming a local job now records an assignment only, never eight fabricated paid hours. Local mode is explicitly labeled and is not a multiuser security boundary.

## Structure

- `src/domain`: standalone integer-agorot calculations, exact minute durations, reconciliation, CSV injection defense, Zod legacy validation.
- `src/lib`: compatibility storage/store and Capacitor lifecycle, haptics and native sharing.
- `src/cloud`: Supabase Auth client, runtime schemas, organization-scoped data loading, Realtime refresh with polling fallback.
- `src/pages/Cloud.tsx`: authenticated owner/manager and worker workspace, invitations, jobs/assignment, clock in/out, approval/correction, payment recording, notifications, migration preview.
- `supabase/migrations`: relational schema, RLS, write-only-through-RPC authorization, transactional claiming/approval/payment and legacy import.
- `ios`, `android`: real Capacitor 8 native projects that bundle the same application. No remote website wrapper URL.

## Data and permissions

UUID primary keys, organization foreign keys, composite cross-organization constraints and RLS apply to every business table. Workers can read available jobs, their own employee row, assignments, timesheets, payments and notifications. Customer agreements and invoice rows are manager-only. Billing policy columns on jobs and billing amounts on timesheets have no client SELECT grant. Direct client writes are revoked; security-definer RPCs pin search_path and check caller membership. Never use service_role in the app.

Invitations bind an unguessable token to a specific email and role, expire after seven days, and redeem once under a row lock. Only an owner creates invitations. Auth registration does not grant organization membership. Company creation creates a new isolated organization owned by its creator, never access to an existing company. Managers currently manage the entire organization; finer team-scoped manager permissions are a later extension.

## Financial policy

Money is integer agorot and minutes are integers; PostgreSQL uses numeric division and half-up rounding per line. Customer minimum policy is `max(minimum_agorot, round(minutes * rate_agorot / 60))`, including the explicit ₪400/₪65 agreement. No universal minimum, fuel fee, transport fee or referral fee is inferred.

Rates are snapshotted at assignment and job creation. Only approved actual timesheets accrue wages. Claims and estimates never accrue wages. One invoice per job prevents multiplying a job minimum by worker count. Default job billing uses the **longest approved worker duration**, once per job. An explicit `worker_shift` billing basis supports per-worker agreements; it must be selected deliberately server-side. Review this business assumption with the company before commercial invoicing.

Customer receipts and worker payments are separate directions; expenses and reimbursements are separate adjustment directions, never revenue. Source IDs are unique per organization. Invoices remain estimates until every noncancelled assignment has approved time. Payment RPCs lock the job and timesheet, deduplicate request IDs and reject overpayment. Corrections invalidate approval and are blocked for jobs with recorded payments until reconciliation is handled. Audit records preserve prior timesheet/job state. Adjustment settlement is not yet integrated into worker payment limits; do not treat reimbursement balances as settled by wage payments.

## Time and offline behavior

UTC timestamptz values are stored server-side; Asia/Jerusalem is used for business dates and display. Clock in/out timestamps come from the server. Manual corrections require explicit timestamp offsets and a reason. Legacy imports with unknown start time use local midnight as a documented placeholder and require approval. Scheduled hours are never used as actual hours.

Cloud mutations require connectivity. Loaded data remains readable during a connection loss; there is no silent offline write queue. Full durable cloud offline cache is pending. Local mode remains available offline after assets are loaded, but this is a separate ledger, not synchronized data.

## WorkLedger lessons

Inspected the authorized local WorkLedger source and both prior build/audit chats. Reused architectural ideas, not its seeded financial history: independent calculation layer, backup validation and preservation, separate receipts/wages, snapshots and audit trail, authentic device build before IPA packaging, and verification after installation. WorkLedger's six-hour floor at ₪65 produces ₪390 and is intentionally **not** copied into the new ₪400 customer minimum rule. Its successful AltServer flow required an English provisioning name and correct embedded-framework paths. macOS rendering glitches are not grounds to remove the requested visual styling.

## Current release boundaries

Supabase project URL/key and deployed migrations are required for real shared use. No credentials were supplied or guessed. Auth email delivery, production Realtime, real concurrent database sessions, APNs/FCM, background push, attachment storage, account deletion automation, advanced vehicle/cargo UI and production reconciliation remain release gates. These are not simulated as working services.
