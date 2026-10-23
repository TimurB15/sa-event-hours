# Setup

Use Node 22+ (tested with 24.22.1), pnpm 11.25.0, and full Xcode 26+ for iOS. Lockfile is pnpm-lock.yaml; the old npm lockfile is removed to avoid inconsistent dependency resolution.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
pnpm native:sync
```

## Shared backend

1. Create an authorized Supabase project; do not point experimental migrations at an existing production database.
2. Apply SQL files in `supabase/migrations` in filename order through the Supabase SQL editor or linked CLI.
3. Copy `.env.example` to `.env.local`. Set project URL and **public anon/publishable key**, never a service role key.
4. Enable email/password Auth and configure a working SMTP provider, email confirmation and password policy. Allowlist your exact web callback and `saevent://auth` for native password recovery. Use HTTPS in production.
5. Enable Realtime publication for jobs, job_assignments, timesheets, payments and notifications in Supabase. Polling remains a fallback.
6. Rebuild/sync the app so public configuration is bundled. Open the cloud icon, sign up, confirm email and create the owner organization.
7. Add a customer agreement. Owner creates employee invitations and supplies the code to the intended employee through the company's approved channel. The app does not send invitation email itself.
8. Worker registers/validates the invited email, signs in, and redeems the code. Test with two accounts before real payroll.

## Existing records

Export the original local ledger through Reports. In the owner workspace, Settings accepts that JSON backup, validates references/duplicates and previews counts. Save the pre-import backup and explicitly confirm transfer. Server imports run transactionally, preserve the original payload, map stable source IDs, and leave historical time pending approval. Never import sample employees without reviewing the preview. Existing target records are not overwritten by an imported source ID.

## Native

```sh
pnpm native:sync
open ios/App/App.xcodeproj
pnpm ios:altstore
# Android requires JDK 21 and Android SDK 36:
pnpm android:debug
pnpm android:bundle
```

Android release signing uses environment variables documented in RELEASE.md. No signing credentials belong in Git. The local Mac had Xcode available but no JDK/Android SDK at audit time.
