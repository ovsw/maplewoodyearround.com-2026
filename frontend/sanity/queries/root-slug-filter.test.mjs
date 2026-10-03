import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ROOT_SLUG_FILTER } from "../../../shared/root-slug-filter.ts";

test("root content queries accept every surrounding-slash variant", () => {
  assert.equal(
    ROOT_SLUG_FILTER,
    'slug.current in [$slug, "/" + $slug, $slug + "/", "/" + $slug + "/"]',
  );

  for (const sourceUrl of [
    new URL("./page.ts", import.meta.url),
    new URL("./post.ts", import.meta.url),
    new URL("./og-image.ts", import.meta.url),
    new URL("../../../studio/presentation/resolve.ts", import.meta.url),
  ]) {
    assert.match(readFileSync(sourceUrl, "utf8"), /ROOT_SLUG_FILTER/);
  }
});
