# Maplewood agent instructions

Read [spec issue #1](https://github.com/ovsw/maplewoodyearround.com-2026/issues/1)
before work. Its decisions and "How the work runs" section govern the rebuild.
Read `CONTEXT.md` and the current issue's acceptance criteria before editing.

## Work loop

- Astra coordinates at most two Astra or Sol 6.1 workers. Each worker owns a
  different issue.
- Take the lowest-numbered open `ready-for-agent` issue whose blockers are
  closed. Check for an existing branch, worktree or "taking this" comment
  first. Continue existing work. Assign and comment only for an unclaimed issue.
- Keep one worktree and one branch per issue. Start new branches from current
  `main`. Preserve other workers' changes.
- Commit and push at least every 30 minutes and before stopping. Use checkpoint
  commits for unfinished work.
- Use Conventional Commits. Run `pnpm verify` before opening each PR.
  Include `Closes #N` and `Part of #1` in the description.
- Require a green `Release gate` on the current PR head. Resolve required
  findings, squash-merge and delete the branch. Never bypass the gate.
- Architectural changes, stored data, authentication, permissions, migrations
  or money get one CodeRabbit PR review. Other logic changes get one CLI review
  before the PR. Looks, copy and content-only changes need no review.
- Run at most one review per PR. Use one route and do not repeat the review
  after fixes. Keep automatic reviews off; trigger required PR reviews once.
- Review Maplewood changes only. Exclude unchanged CAC code and already-merged
  work unless Ovi asks for its review.
- For a credential or decision only Ovi can supply, add `ready-for-human`
  and comment with the exact need. Take another eligible issue.
  Never invent a replacement for a missing credential.
- Post one two-line daily comment on the Basecamp document named in the spec:
  what works now, then what puts 2026-10-15 at risk.
- Stop this run when #5, #6 and #7 are merged. Do not start #8 or claim launch
  readiness. A later authorized run ends after #19 passes.
- Ovi owns DNS, client invitations, client contact and service cancellation.

## Public repository

Keep tokens, backups and private personal data out of code, commits, issues
and PRs. Use ignored local env files for credentials. Private details belong
in the Basecamp document. Only copy contact details already on the public site.
Leave Webflow and Airtable data intact.

## Dataset safety

Required migration and draft writes have standing permission. Before the
first write in a task, name and verify the Maplewood project and dataset.
Create a timestamped backup and verify it with `gzip -t`. Stop if it fails.

**Back up documents only. Never download the assets.** Every backup is a raw
export: `pnpm --dir studio exec sanity dataset export production <file>
--no-assets`. The images and files stay in Sanity; a copy with assets is about
430 MB and adds nothing. This rule holds even when a spec or issue says "with
assets". `pnpm migrate` makes this backup for you. Keep backups in
`/storage/backups/maplewood`, outside version control. A raw backup cannot
bring back a deleted asset, so ask Ovi before a change that deletes assets.

Preserve draft and published state when changing stored content. Feature
content goes to drafts unless the issue requires publication. Never target
the source project's dataset. The importer does not run again: the content in
Sanity is the content the client edits and publishes.
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

## Page content work

Page work follows the OVS Website Workflow on the Basecamp card table. Read
`docs/agents/pages.md` before `/page-plan`, `/page-draft`, `/page-polish` or
"send to client review". Run `/ovs-workflow-setup` when a setup item is
missing or a page skill stops on one.

## Browser and handoff

Reuse a matching dev server if its port is in use. Use Chromium for browser
checks. For Sanity handoffs, link to the exact page in Studio Presentation,
preserve the draft perspective and confirm the expected draft content appears.
A login or HTTP 200 is not proof. Give the viewport and what to inspect.
State what remains visually unverified.

Report user-visible results in plain English, at most six short final lines.
Keep `AGENTS.md` and `CLAUDE.md` identical.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in this repository's GitHub Issues. See
`docs/agents/issue-tracker.md`.

### Triage labels

Use the canonical labels `needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context domain-doc layout. See
`docs/agents/domain.md`.
