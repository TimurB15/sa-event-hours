# Testing

Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.

Vitest covers money/minute calculations, overnight shifts, the ₪400 minimum, adjustment source deduplication, payment reconciliation, Jerusalem dates, CSV formula escaping, legacy schema validation, and PostgreSQL authorization/workflow using PGlite.

PGlite tests execute the migrations and actual RLS/RPC functions with authenticated/anonymous roles. They cover organization isolation, worker permission denial, idempotent claims, capacity checks, clocking, stale versions, approval, payments, audit history and repeat-safe import. PGlite serializes connections; this does not prove concurrent multi-session behavior on a deployed Supabase server.

Initial verification on 2026-10-23: 13 tests passed; web production build and unsigned arm64 iPhone Release build succeeded. Final checks and installation evidence will be added during release validation. Supabase email delivery, live two-account synchronization and push require configured external services.
