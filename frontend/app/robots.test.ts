import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

async function robotsFor(siteEnv: string) {
  vi.stubEnv("NEXT_PUBLIC_SITE_ENV", siteEnv);
  const { default: robots } = await import("@/app/robots");
  return robots();
}

function disallowed(rules: Awaited<ReturnType<typeof robotsFor>>["rules"]) {
  const [rule] = Array.isArray(rules) ? rules : [rules];
  return [rule.disallow ?? []].flat();
}

describe("robots", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("disallows Camp HQ in production", async () => {
    expect(disallowed((await robotsFor("production")).rules)).toContain("/hq");
  });

  test("disallows everything, Camp HQ included, outside production", async () => {
    expect(disallowed((await robotsFor("preview")).rules)).toEqual(["/"]);
  });
});
