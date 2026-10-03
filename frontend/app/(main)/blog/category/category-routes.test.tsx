import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { documentDataAttribute } from "@/components/blog-card";
import {
  fetchCategory,
  fetchCategoryPosts,
  fetchCategoryPostsCount,
} from "@/sanity/lib/fetch";
import { sanityFetchMetadata } from "@/sanity/lib/live";
import { generateMetadata as generateFirstPageMetadata } from "./[slug]/page";
import { generateMetadata as generatePaginatedMetadata } from "./[slug]/[page]/page";
import { CategoryArchiveRoute } from "./_components/category-archive-route";

vi.mock("@/components/blog-pagination", () => ({ default: () => null }));
vi.mock("@/components/breadcrumb-json-ld", () => ({ default: () => null }));
vi.mock("@/sanity/lib/fetch", () => ({
  fetchCategory: vi.fn(),
  fetchCategoryPosts: vi.fn(),
  fetchCategoryPostsCount: vi.fn(),
}));
vi.mock("@/sanity/lib/live", () => ({
  getDynamicFetchOptions: vi.fn(),
  sanityFetchMetadata: vi.fn(),
  sanityFetchStaticParams: vi.fn(),
}));
vi.mock("next/headers", () => ({ draftMode: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not found");
  },
}));

const category = {
  _id: "category-1",
  _type: "category" as const,
  description: "News from the island.",
  meta: null,
  publishedPostCount: 1,
  slug: { current: "news" },
  title: "News",
};

describe("category routes", () => {
  beforeEach(() => {
    vi.mocked(sanityFetchMetadata).mockReset();
    vi.mocked(fetchCategory).mockReset();
    vi.mocked(fetchCategoryPosts).mockReset();
    vi.mocked(fetchCategoryPostsCount).mockReset();
  });

  it("fetches metadata from the published perspective on both route shapes", async () => {
    vi.mocked(sanityFetchMetadata).mockResolvedValue({ data: category } as never);

    await generateFirstPageMetadata({ params: Promise.resolve({ slug: "news" }) });
    await generatePaginatedMetadata({
      params: Promise.resolve({ page: "2", slug: "news" }),
    });

    expect(sanityFetchMetadata).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ params: { slug: "news" }, perspective: "published" }),
    );
    // Each route shape also reads the published Site settings defaults.
    expect(sanityFetchMetadata).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ perspective: "published" }),
    );
    expect(sanityFetchMetadata).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ params: { slug: "news" }, perspective: "published" }),
    );
  });

  it("allows a missing published category during metadata generation", async () => {
    vi.mocked(sanityFetchMetadata).mockResolvedValue({ data: null } as never);

    await expect(
      generateFirstPageMetadata({ params: Promise.resolve({ slug: "draft-only" }) }),
    ).resolves.toEqual({});
    await expect(
      generatePaginatedMetadata({
        params: Promise.resolve({ page: "2", slug: "draft-only" }),
      }),
    ).resolves.toEqual({});
  });

  it("renders draft category fields as editable without nesting a main landmark", async () => {
    vi.mocked(fetchCategory).mockResolvedValueOnce(category as never);
    vi.mocked(fetchCategoryPosts).mockResolvedValueOnce([]);
    vi.mocked(fetchCategoryPostsCount).mockResolvedValueOnce(0);

    const { container } = render(
      await CategoryArchiveRoute({
        currentPage: 1,
        perspective: "drafts",
        slug: "news",
        stega: true,
      }),
    );
    const dataAttribute = documentDataAttribute({
      id: category._id,
      stega: true,
      type: "category",
    });

    expect(screen.getByRole("heading", { level: 1, name: "News" })).toHaveAttribute(
      "data-sanity",
      dataAttribute?.("title"),
    );
    expect(screen.getByText("News from the island.")).toHaveAttribute(
      "data-sanity",
      dataAttribute?.("description"),
    );
    expect(container.querySelector("main")).not.toBeInTheDocument();
  });
});
