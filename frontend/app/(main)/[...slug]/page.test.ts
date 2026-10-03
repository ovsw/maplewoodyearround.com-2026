import { beforeEach, describe, expect, it, vi } from "vitest";

const sanityFetchMetadata = vi.hoisted(() => vi.fn());
const sanityFetchStaticParams = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("@/components/root-content", () => ({ RootContentView: vi.fn() }));
vi.mock("@/sanity/lib/fetch", () => ({
  fetchSanityPageBySlug: vi.fn(),
  PAGES_SLUGS_QUERY: "pages",
}));
vi.mock("@/sanity/lib/live", () => ({
  getDynamicFetchOptions: vi.fn(),
  sanityFetchMetadata,
  sanityFetchStaticParams,
}));
vi.mock("@/sanity/lib/metadata", () => ({
  generatePageMetadata: vi.fn(),
}));
vi.mock("@/sanity/queries/page", () => ({ PAGE_QUERY: "page" }));
vi.mock("next/headers", () => ({ draftMode: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound }));

import { generateMetadata, generateStaticParams } from "./page";

describe("root content metadata", () => {
  beforeEach(() => {
    sanityFetchMetadata.mockReset();
    sanityFetchStaticParams.mockReset();
    notFound.mockClear();
  });

  it("generates every segment for nested page slugs", async () => {
    sanityFetchStaticParams.mockResolvedValue({
      data: [{ slug: { current: "/staff/available-positions/" } }],
    });

    await expect(generateStaticParams()).resolves.toEqual([
      { slug: ["staff", "available-positions"] },
    ]);
  });

  it("does not generate page routes inside the blog namespace", async () => {
    sanityFetchStaticParams.mockResolvedValue({
      data: [{ slug: { current: "blog/first-post" } }],
    });

    await expect(generateStaticParams()).resolves.toEqual([{ slug: ["__placeholder__"] }]);
  });

  it("does not turn a draft-only route into a 404", async () => {
    sanityFetchMetadata.mockResolvedValue({ data: null });

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: ["draft-post"] }) }),
    ).resolves.toEqual({});
    expect(notFound).not.toHaveBeenCalled();
  });
});
