# Build flow

The work loop and review budget are in `AGENTS.md` and spec issue #1.
Issue acceptance criteria define the required outcome.

Automatic CodeRabbit reviews are off. `.macroscope/ignore.md` excludes all
paths, including hidden files, from Macroscope review. These settings preserve
the spec's single paid review on issue #6.

1. Trace current behavior and ownership before editing. Reuse a fitting
   pattern and keep the change within the claimed issue.
2. Keep schemas, queries, renderers and stored content consistent.
   Back up the dataset before writes.
3. Run focused checks during implementation.
4. Run `pnpm verify` before the PR. Use one PR per issue, based on current
   `main`, with `Closes #N` and `Part of #1`.
5. For issue #6 only, request the project's one CodeRabbit PR review.
   Fix or answer all findings. Do not request another review.
6. Once the current head's Release gate and required checks pass and no
   human-only decision remains, squash-merge and delete the branch.

A green gate does not prove visual parity. Complete the issue's screenshots,
accessibility checks and link tests. Report remaining visual uncertainty.
