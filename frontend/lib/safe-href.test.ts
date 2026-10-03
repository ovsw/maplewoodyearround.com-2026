import { describe, expect, it } from "vitest";
import { getSafeLinkHref } from "./safe-href";

describe("getSafeLinkHref", () => {
  it.each([
    "/",
    "/service-options/",
    "#eligibility",
    "https://example.com/path",
    "http://example.com",
    "mailto:hello@example.com",
    "tel:+16025550123",
  ])("accepts supported href %s", (href) => {
    expect(getSafeLinkHref(href)).toBe(href);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,unsafe",
    "relative/path",
    "www.example.com",
    "//example.com/path",
    "/\\evil.example/path",
    "https:/example.com",
    "https:\\evil.example/path",
    "",
  ])("rejects unsupported href %s", (href) => {
    expect(getSafeLinkHref(href)).toBeNull();
  });
});
