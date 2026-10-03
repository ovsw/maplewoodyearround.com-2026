import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";

test("repeated interrupts still stop both child groups and release the reservation", { skip: process.platform === "win32", timeout: 15000 }, async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "dev-worktree-test-"));
  mkdirSync(path.join(root, "scripts"));
  mkdirSync(path.join(root, "bin"));
  copyFileSync(new URL("./dev-worktree.mjs", import.meta.url), path.join(root, "scripts/dev-worktree.mjs"));
  writeFileSync(path.join(root, "scripts/worktree-config.mjs"), `
    import { writeFile } from 'node:fs/promises';
    export const HOST = '127.0.0.1';
    export async function allocatePorts() {
      return { slot: 0, frontendPort: 3000, studioPort: 3333,
        release: () => writeFile(${JSON.stringify(path.join(root, "released"))}, 'released') };
    }
  `);
  const pnpm = path.join(root, "bin/pnpm");
  writeFileSync(pnpm, `#!${process.execPath}
    import { appendFileSync } from 'node:fs';
    appendFileSync(${JSON.stringify(path.join(root, "pids"))}, process.pid + '\\n');
    process.on('SIGINT', () => console.log('interrupt-received'));
    process.on('SIGTERM', () => {});
    console.log('child-ready');
    setInterval(() => {}, 1000);
  `);
  chmodSync(pnpm, 0o755);
  const child = spawn(process.execPath, [path.join(root, "scripts/dev-worktree.mjs")], {
    cwd: root,
    env: { ...process.env, PATH: `${path.dirname(pnpm)}${path.delimiter}${process.env.PATH}` },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => {
    child.kill("SIGKILL");
    if (existsSync(path.join(root, "pids"))) {
      for (const pid of readFileSync(path.join(root, "pids"), "utf8").trim().split("\n")) {
        try { process.kill(-Number(pid), "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
      }
    }
    rmSync(root, { recursive: true, force: true });
  });
  let output = "";
  child.stdout.on("data", (data) => output += data);
  child.stderr.on("data", (data) => output += data);
  const closed = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code, signal) => resolve({ code, signal }));
  });
  async function waitFor(text, count) {
    const deadline = Date.now() + 4000;
    while (output.split(text).length - 1 < count && Date.now() < deadline) await delay(20);
    assert.ok(output.split(text).length - 1 >= count, output);
  }
  await waitFor("child-ready", 2);
  child.kill("SIGINT");
  await waitFor("interrupt-received", 2);
  child.kill("SIGINT");
  assert.deepEqual(await closed, { code: 0, signal: null }, output);
  assert.equal(readFileSync(path.join(root, "released"), "utf8"), "released");
});
