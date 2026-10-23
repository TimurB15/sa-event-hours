# SA Event Logistics

Hebrew RTL event workforce management for iPhone, Android and the web. Built on the existing SA hours ledger with React/TypeScript, Capacitor and an optional Supabase shared workspace.

## Run

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
pnpm native:sync
pnpm ios:altstore
```

The original local ledger remains available and preserves its storage key. The cloud icon opens the authenticated workspace; a real Supabase project must be configured before it can synchronize. The existing GitHub Pages deployment is unchanged by this feature branch.

- [Architecture and release boundaries](docs/ARCHITECTURE.md)
- [Setup and data migration](docs/SETUP.md)
- [Testing and observed results](docs/TESTING.md)
- [iOS, AltStore and Android release](docs/RELEASE.md)
- [Security](docs/SECURITY.md)
- [Design references](docs/DESIGN.md)

Do not use unreviewed imported hours or unconfigured customer policies for production payroll. Installation through AltStore signs a real device IPA; an unsigned build alone is not proof of installation.
