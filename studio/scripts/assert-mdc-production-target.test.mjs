import assert from "node:assert/strict";
import test from "node:test";
import { assertMdcProductionTarget } from "./assert-mdc-production-target.mjs";

test("accepts only the MDC production target", () => {
  assert.doesNotThrow(() =>
    assertMdcProductionTarget({
      dataset: "production",
      projectId: "193h5qm1",
    }),
  );

  assert.throws(
    () =>
      assertMdcProductionTarget({
        dataset: "production",
        projectId: "another-project",
      }),
    /Refusing to run against another-project\/production/,
  );

  assert.throws(
    () =>
      assertMdcProductionTarget({
        dataset: "development",
        projectId: "193h5qm1",
      }),
    /Refusing to run against 193h5qm1\/development/,
  );
});
