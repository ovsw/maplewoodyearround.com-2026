import { afterEach, expect, it, vi } from "vitest";
import { SiteAnalytics } from "./site-analytics";

afterEach(() => vi.unstubAllEnvs());

it("excludes analytics from local, preview and draft pages even with production settings", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_ENV", "production");
  for (const env of ["", "development", "preview"]) {
    vi.stubEnv("VERCEL_ENV", env);
    expect(SiteAnalytics({})).toBeNull();
  }
  vi.stubEnv("VERCEL_ENV", "production");
  expect(SiteAnalytics({ draft: true })).toBeNull();
  expect(SiteAnalytics({})).not.toBeNull();
  vi.stubEnv("NEXT_PUBLIC_SITE_ENV", "preview");
  expect(SiteAnalytics({})).toBeNull();
});
