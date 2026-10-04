import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { draftMode } from "next/headers";
import { fetchSanitySettings } from "@/sanity/lib/fetch";
import { SiteAnalyticsLoader } from "./site-analytics-loader";
import { SiteAnalytics } from "./site-analytics";

vi.mock("next/headers", () => ({ draftMode: vi.fn() }));
vi.mock("@/sanity/lib/fetch", () => ({ fetchSanitySettings: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SITE_ENV", "production");
  vi.mocked(draftMode).mockResolvedValue({
    isEnabled: false,
    enable: vi.fn(),
    disable: vi.fn(),
  });
});
afterEach(() => vi.unstubAllEnvs());

it("omits optional analytics when the published settings request fails", async () => {
  vi.mocked(fetchSanitySettings).mockRejectedValue(
    new Error("Sanity unavailable"),
  );
  await expect(SiteAnalyticsLoader()).resolves.toBeNull();
});

it("keeps production analytics on successful published settings reads", async () => {
  vi.mocked(fetchSanitySettings).mockResolvedValue(null);
  const result = await SiteAnalyticsLoader();
  expect(result?.type).toBe(SiteAnalytics);
  expect(fetchSanitySettings).toHaveBeenCalledWith({
    perspective: "published",
    stega: false,
  });
});

it("does not fetch analytics settings in preview or draft mode", async () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  expect(await SiteAnalyticsLoader()).toBeNull();
  vi.stubEnv("VERCEL_ENV", "production");
  vi.mocked(draftMode).mockResolvedValue({
    isEnabled: true,
    enable: vi.fn(),
    disable: vi.fn(),
  });
  expect(await SiteAnalyticsLoader()).toBeNull();
  expect(fetchSanitySettings).not.toHaveBeenCalled();
});
