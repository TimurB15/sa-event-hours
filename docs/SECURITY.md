# Security

Use public Supabase keys in Vite configuration; service-role credentials must never enter frontend code or Git. Apply all migrations before enabling shared use. Business tables have RLS and clients have no direct write grants. RPCs enforce membership, roles, row locks, valid transitions and financial limits.

Worker financial access is restricted to their own wages/payments. Customer agreement fields and invoice rows are restricted. Invitations require the intended authenticated email and expire after seven days. Confirm email verification is enabled in Supabase. Review database grants after adding tables/functions.

Auth sessions currently use the SDK's persistent browser/WebView storage. Native Keychain-backed token storage is a remaining hardening task; do not claim hardware-protected token storage. No analytics or continuous location tracking is included. Backups and exported reports contain business/personnel information and are shared only by explicit user action.

A device IPA built without signing is not authenticated or installable directly. AltServer signs it for the owner's account. Do not commit certificates, passwords, provisioning profiles, keystores or session data.

Account deletion and legal record-retention policy require operator configuration before store publication. Production service configuration, multi-session concurrency tests and a deployment security review remain release gates.
