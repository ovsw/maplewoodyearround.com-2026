# Sanity CLI

Run Studio commands from its workspace to load `studio/.env.local`:

```bash
pnpm --dir studio exec sanity <command>
```

Use the Maplewood project-scoped `SANITY_AUTH_TOKEN`. Verify the project ID
and dataset before a write. Follow the backup requirements in `AGENTS.md`.

For reads, use `pnpm sanity:query '<groq>' ['<json params>']`.

To change stored content, add a migration to `studio/scripts/migrations/`
and test it on fixtures. `studio/scripts/lib/migration.mjs` describes the
format. `pnpm migrate <name>` prints the plan and writes nothing.
`pnpm migrate <name> --apply` checks the target, makes a raw backup of the
dataset in `/storage/backups/maplewood`, and writes. A raw backup keeps every
document and its asset references, not the asset files.
For schema and query changes, run `pnpm typegen`.

Deploy with `pnpm deploy:studio`. It loads the separate `SANITY_DEPLOY_TOKEN`
and production preview settings. Direct `sanity deploy` bypasses the guard.
Read `docs/deployment.md` for deployment settings.
