# Maplewood Year Round

Next.js Website and Sanity Studio for the Maplewood rebuild.
[Issue #1](https://github.com/ovsw/maplewoodyearround.com-2026/issues/1)
defines scope, work order and release criteria. Generic machinery comes from
the CAC code base; the live Maplewood site defines the look.

## Local setup

Use the Node.js and pnpm versions in `package.json`. Run `pnpm install`.
Copy `frontend/.env.local.example` to `frontend/.env.local` and
`studio/.env.local.example` to `studio/.env.local`. Add authorized local
values. The root `.env.example` lists env names. Keep credentials untracked.

The read token enables draft previews. `SANITY_AUTH_TOKEN` enables content
operations; `SANITY_DEPLOY_TOKEN` is the separate Studio deployment token.
Verify both workspaces target project `193h5qm1` and dataset `production`.

Run `pnpm dev` for both apps; read its output for assigned ports.
Reuse a matching server already running on the required port.
Add Website and Studio origins with `pnpm setup:sanity-cors`.

## Development

Run commands from the repository root. Add dependencies with
`pnpm --dir frontend add <package>` or `pnpm --dir studio add <package>`.

- `pnpm dev:frontend` and `pnpm dev:studio` start one app.
- `pnpm typecheck`, `pnpm lint` and focused tests check development changes.
- `pnpm typegen` regenerates types after schema or GROQ changes.
- `pnpm page-builder:new <name>` creates a registered section.
- `pnpm sanity:query '<groq>'` reads content with local credentials.
- `pnpm verify` runs required checks before each PR.
- `pnpm deploy:studio` deploys Studio with the production guard.

Read `docs/agents/page-builder.md` before section changes. Change schemas,
queries and renderers together. Regenerate `studio/schema.json` and
`frontend/sanity.types.ts`; do not edit generated files.
Back up the dataset before writes, as specified in `AGENTS.md`.

## Release

Use one PR per issue and a green `Release gate` before squash merge.
Production comes from verified `main` revisions. Previews send `noindex`.
Read `docs/deployment.md` for deployment checks.
Ovi owns the domain switch and cancellation of the old services.

## Repository

- `frontend/`: Website, queries and section renderers.
- `studio/`: Studio and content schemas.
- `shared/`: code used by both apps.
- `docs/agents/`: task-specific operating instructions.
- `docs/migration/legacy-mdc/`: unchanged earlier Maplewood work to port.
