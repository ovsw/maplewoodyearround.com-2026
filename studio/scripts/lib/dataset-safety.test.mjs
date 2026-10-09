import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { backupDataset } from "./dataset-safety.mjs";

test("a backup exports the documents only, never the assets", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "backup-test-"));
  try {
    const commands = [];
    const file = await backupDataset({
      studioDirectory: path.join(dir, "repo", "studio"),
      token: "test",
      root: path.join(dir, "backups"),
      label: "test",
      run: (command, args) => {
        commands.push([command, ...args]);
        if (command === "pnpm") writeFileSync(args[5], "");
        return { status: 0 };
      },
    });
    const [exported] = commands;
    assert.deepEqual(exported.slice(0, 6), ["pnpm", "exec", "sanity", "dataset", "export", "production"]);
    assert.ok(exported.includes("--no-assets"));
    assert.deepEqual(commands[1], ["gzip", "-t", file]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
