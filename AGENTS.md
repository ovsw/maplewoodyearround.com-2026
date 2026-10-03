# Maplewood agent instructions

Read [spec issue #1](https://github.com/ovsw/maplewoodyearround.com-2026/issues/1)
before work. Its decisions and "How the work runs" section govern the rebuild.
Read `CONTEXT.md` and the current issue's acceptance criteria before editing.

## Work loop

- Astra coordinates up to three Astra or Sol 6.1 workers.
- Take the lowest-numbered open `ready-for-agent` issue whose blockers are
  closed. Assign it to yourself and comment "taking this".
- Use one worktree and a branch from current `main` per issue. Coordinate
  shared files and preserve other workers' changes.
- Use Conventional Commits. Run `pnpm verify` before opening each PR.
  Include `Closes #N` and `Part of #1` in the description.
- Require a green `Release gate` on the current PR head. Resolve required
  findings, squash-merge and delete the branch. Never bypass the gate.
- The only paid CodeRabbit review in this project is on the content-model PR
  for issue #6. Keep automatic reviews off. No other CLI or PR reviews.
- For a credential or decision only Ovi can supply, add `ready-for-human`
  and comment with the exact need. Take another eligible issue.
  Never invent a replacement for a missing credential.
- Post one two-line daily comment on the Basecamp document named in the spec:
  what works now, then what puts 2026-10-15 at risk.
- Stop after issue #19. Post "ready to launch" only after its checks pass.
  Ovi owns DNS, client invitations, client contact and service cancellation.

## Public repository

Keep tokens, backups and private personal data out of code, commits, issues
and PRs. Use ignored local env files for credentials. Private details belong
in the Basecamp document. Only copy contact details already on the public site.
Leave Webflow and Airtable data intact.

## Dataset safety

Required migration and draft writes have standing permission. Before the
first write in a task, name and verify the Maplewood project and dataset.
Create a timestamped backup and verify it with `gzip -t`. Stop if it fails.
Use a raw export for document-only work; include assets when assets or their
references change. Keep backups outside version control.

Preserve draft and published state when changing stored content. Feature
content goes to drafts unless the issue requires publication. Never target
the source project's dataset. Studio edits wait until launch; the importer
runs again on the date in the private Basecamp document.
Dataset deletion and unrelated settings or access changes need explicit
authorization.

## Development

Before using a Next.js API, read its installed guide in
`frontend/node_modules/next/dist/docs/`; this version can differ from training
examples. Read `README.md` before changing dependencies, schemas or queries.
Read `docs/agents/page-builder.md` before section work,
`docs/agents/sanity-cli.md` before Sanity commands, and
`docs/deployment.md` before deployment.

Use absolute paths or an explicit working directory. Inspect errors before
drawing conclusions from empty output. Use `rg` or `git ls-files`; exclude
dependencies, build outputs, backups and nested worktrees from broad scans.
Keep `docs/migration/legacy-mdc/` unchanged and outside build and lint inputs.
Port its hero, video zoom grid and header when the later issues require them.

Run focused checks during development and the release suite before the PR.
Test data migration, security, subtle logic and costly regressions. Complete
the screenshots, accessibility and link checks required by each issue.
The live Maplewood site is the visual reference. This is not a redesign.

## Browser and handoff

Reuse a matching dev server if its port is in use. Use Chromium for browser
checks. For Sanity handoffs, link to the exact page in Studio Presentation,
preserve the draft perspective and confirm the expected draft content appears.
A login or HTTP 200 is not proof. Give the viewport and what to inspect.
State what remains visually unverified.

Report user-visible results in plain English, at most six short final lines.
Keep `AGENTS.md` and `CLAUDE.md` identical.
