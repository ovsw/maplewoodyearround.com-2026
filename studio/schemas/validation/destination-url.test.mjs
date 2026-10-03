import assert from "node:assert/strict";
import test from "node:test";
import { validateDestinationUrl } from "./destination-url.ts";

test("accepts supported destinations with surrounding spaces", () => {
  for (const href of ["/", "/summer-camp?year=2026#rates", " https://example.org/form ", "HTTP://example.org", "mailto:office@example.org", "tel:+15165550100"]) {
    assert.equal(validateDestinationUrl(href), true, href);
  }
});

test("rejects browser-normalized off-site paths and unsafe schemes", () => {
  for (const href of [undefined, " ", "//evil.example", "/\\evil.example", " /\t/evil.example", "/\n/evil.example", "\rhttps://example.org", "javascript:alert(1)", "https://", "relative/path", "https://example.org/\\path"]) {
    assert.notEqual(validateDestinationUrl(href), true, JSON.stringify(href));
  }
});
