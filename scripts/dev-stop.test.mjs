import assert from "node:assert/strict";
import test from "node:test";
import { alive } from "./dev-stop.mjs";

test("permission errors do not claim a process has stopped", (t) => {
  const error = Object.assign(new Error("denied"), { code: "EPERM" });
  t.mock.method(process, "kill", () => { throw error; });
  assert.equal(alive(12345), true);
  error.code = "ESRCH";
  assert.equal(alive(12345), false);
  error.code = "EINVAL";
  assert.throws(() => alive(12345), error);
});
