import assert from "node:assert/strict";
import test from "node:test";

import { requireStudioEnvironmentValue } from "./environment.ts";

test("names a missing Sanity Studio environment value", () => {
  for (const value of [undefined, "", "   "]) {
    assert.throws(
      () =>
        requireStudioEnvironmentValue("SANITY_STUDIO_PROJECT_ID", value),
      /Missing environment variable: SANITY_STUDIO_PROJECT_ID/,
    );
  }
});

test("returns a trimmed Sanity Studio environment value", () => {
  assert.equal(
    requireStudioEnvironmentValue("SANITY_STUDIO_DATASET", " production "),
    "production",
  );
});
