import { beforeEach, describe, expect, it, vi } from "vitest";

const sanityFetchMetadata = vi.hoisted(() => vi.fn());
const generateBlogIndexMetadata = vi.hoisted(() => vi.fn());
const generatePageMetadata = vi.hoisted(() => vi.fn());
const settings = vi.hoisted(() => ({ seoDescription: "Site default", seoImage: null }));
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("../_components/blog-index-route", () => ({ BlogIndexRoute: vi.fn() }));
vi.mock("../_components/blog-post-route", () => ({ BlogPostRoute: vi.fn() }));
vi.mock("@/sanity/lib/fetch", () => ({ POSTS_SLUGS_QUERY: "post slugs" }));
vi.mock("@/sanity/lib/live", () => ({
  getDynamicFetchOptions: vi.fn(),
  sanityFetchMetadata,
  sanityFetchStaticParams: vi.fn(),
}));
vi.mock("@/sanity/lib/metadata", () => ({
  generateBlogIndexMetadata,
  generatePageMetadata,
}));
vi.mock("@/sanity/lib/seo-settings", () => ({
  fetchSeoSettings: vi.fn(async () => settings),
}));
vi.mock("@/sanity/queries/blog-index", () => ({
  BLOG_INDEX_QUERY: "blog index",
  ELIGIBLE_BLOG_POSTS_COUNT_QUERY: "post count",
}));
vi.mock("@/sanity/queries/post", () => ({ PUBLISHED_POST_QUERY: "published post" }));
vi.mock("next/headers", () => ({ draftMode: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound }));

import { generateMetadata } from "./page";

describe("blog segment metadata", () => {
  beforeEach(() => {
    sanityFetchMetadata.mockReset();
    generateBlogIndexMetadata.mockReset();
    generatePageMetadata.mockReset();
    notFound.mockClear();
  });

  it("routes a post slug through the post namespace", async () => {
    const post = { _type: "post", title: "First post" };
    sanityFetchMetadata.mockResolvedValue({ data: post });
    generatePageMetadata.mockReturnValue({ title: "First post" });

    await expect(
      generateMetadata({ params: Promise.resolve({ page: "first-post" }) }),
    ).resolves.toEqual({ title: "First post" });
    expect(sanityFetchMetadata).toHaveBeenCalledWith({
      query: "published post",
      params: { slug: "first-post" },
      perspective: "published",
    });
    expect(generatePageMetadata).toHaveBeenCalledWith({
      page: post,
      path: "/blog/first-post",
      settings,
    });
  });

  it("keeps numeric segments in the pagination route", async () => {
    const blogIndex = { _type: "blogIndex", title: "Blog" };
    sanityFetchMetadata.mockResolvedValue({ data: blogIndex });
    generateBlogIndexMetadata.mockReturnValue({ title: "Blog, page 2" });

    await expect(
      generateMetadata({ params: Promise.resolve({ page: "2" }) }),
    ).resolves.toEqual({ title: "Blog, page 2" });
    expect(generateBlogIndexMetadata).toHaveBeenCalledWith({
      blogIndex,
      page: 2,
      settings,
    });
  });

  it("rejects the page-one alias", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ page: "1" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
