import assert from "node:assert/strict";
import test from "node:test";
import { runParallel } from "./run-parallel.mjs";

test("all commands run to the end and one failure fails the run", async () => {
  const lines = [];
  const passed = await runParallel(["node -e \"process.exit(3)\"", "node -e \"console.log('done')\""], {
    log: (text) => lines.push(text),
  });
  const output = lines.join("");
  assert.equal(passed, false);
  assert.match(output, /process\.exit\(3\)" failed \(exit 3\)/);
  assert.match(output, /console\.log\('done'\)" passed/);
  assert.match(output, /\ndone\n/);
});

test("the run passes when every command passes", async () => {
  assert.equal(await runParallel(["node -e \"\"", "node -e \"\""], { log: () => {} }), true);
});
