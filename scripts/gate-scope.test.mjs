import assert from "node:assert/strict";
import test from "node:test";
import { decide, isDocsOnly, parseChangedFiles } from "./gate-scope.mjs";

test("documentation-only changes skip the code gate", () => {
  assert.equal(
    isDocsOnly([
      "docs/agents/build-flow.md",
      "docs/plans/2026-09-18-next-work-plan.md",
      "README.md",
      "CLAUDE.md",
      ".claude/skills/page-draft/SKILL.md",
      ".claude/hooks/copy-local-env.sh",
      ".codex/notes.md",
    ]),
    true,
  );
});

test("any code, config, lockfile, or workflow change runs the code gate", () => {
  for (const file of [
    "frontend/app/page.tsx",
    "studio/schema.json",
    "package.json",
    "pnpm-lock.yaml",
    ".github/workflows/release-gate.yml",
    ".github/dependabot.yml",
    "scripts/gate-scope.mjs",
    "docs/../frontend/lib/x.ts",
    "frontend/README.md.bak",
  ]) {
    assert.equal(isDocsOnly(["README.md", file]), false, file);
  }
});

test("an empty or blank file list runs the code gate", () => {
  assert.equal(isDocsOnly([]), false);
  assert.equal(isDocsOnly(["", "  ", "\n"]), false);
  assert.equal(decide([]).code, true);
});

test("the workflow's tab-separated lines parse into entries with old paths", () => {
  assert.deepEqual(
    parseChangedFiles("README.md\t\ndocs/moved.md\tfrontend/lib/moved.ts\n\n  \n"),
    [
      { filename: "README.md" },
      { filename: "docs/moved.md", previousFilename: "frontend/lib/moved.ts" },
    ],
  );
});

test("a code file renamed into documentation still runs the code gate", () => {
  const moved = [{ filename: "docs/notes.md", previousFilename: "frontend/lib/notes.ts" }];
  assert.equal(decide(moved).code, true);
  const renamedDoc = [{ filename: "docs/new.md", previousFilename: "docs/old.md" }];
  assert.equal(decide(renamedDoc).code, false);
});

test("an incomplete file list runs the code gate", () => {
  const docs = [{ filename: "README.md" }, { filename: "docs/a.md" }];
  assert.equal(decide(docs, 2).code, false);
  assert.equal(decide(docs, 3).code, true);
  assert.equal(decide(docs, Number.NaN).code, true);
});
