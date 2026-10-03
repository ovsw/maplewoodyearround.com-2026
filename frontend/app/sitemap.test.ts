import { describe, expect, it, vi } from "vitest";

const sanityFetchMetadata = vi.hoisted(() => vi.fn());
vi.mock("@/sanity/lib/live", () => ({ sanityFetchMetadata }));

import sitemap from "./sitemap";

describe("public sitemap", () => {
  it("always fetches published content and retains category eligibility", async () => {
    const home = {
      _type: "homePage",
      url: "https://example.test/",
      lastModified: "2026-10-01T00:00:00Z",
    };
    const category = {
      _type: "category",
      url: "https://example.test/blog/category/camp",
      description: "Camp news",
      publishedPostCount: 1,
      lastModified: null,
    };
    sanityFetchMetadata.mockResolvedValueOnce({
      data: [home, category, { ...category, publishedPostCount: 0 }],
    });

    expect(await sitemap()).toEqual([
      { url: home.url, lastModified: home.lastModified },
      { url: category.url },
    ]);
    expect(sanityFetchMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ perspective: "published" }),
    );
  });
});
