import { render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { PostCard, documentDataAttribute } from "@/components/blog-card";
import Blocks from "@/components/blocks";
import LatestArticles from "@/components/blocks/latest-articles";
import {
  BlogIndexRoute,
  withBlogListingSection,
} from "@/app/(main)/blog/_components/blog-index-route";
import {
  fetchBlogIndex,
  fetchLatestPost,
  fetchRegularPosts,
  fetchRegularPostsCount,
} from "@/sanity/lib/fetch";
import {
  LATEST_POST_QUERY,
  REGULAR_POSTS_QUERY,
  type BlogPost,
} from "@/sanity/queries/blog-index";
import {
  blogPostOrder,
  publishedPostFilter,
} from "@/sanity/queries/blog-post-listing";
import { latestArticlesQuery } from "@/sanity/queries/latest-articles";
import {
  BLOG_POSTS_PER_PAGE,
  calculateBlogPagination,
  getCategoryArchivePath,
  getCategoryPaginatedStaticParams,
  getCategoryStaticParams,
  getBlogCanonicalPath,
  getBlogPageTitle,
  getBlogPaginationUrl,
  getBlogPostWindow,
  getRegularPostQueryParams,
  getBlogResultsLabel,
  isIndexableCategory,
  parseBlogPageSegment,
  isBlogPageOutOfRange,
} from "./blog-index";

vi.mock("@/components/blocks", () => ({ default: vi.fn(() => null) }));
vi.mock("@/components/breadcrumb-json-ld", () => ({ default: () => null }));
vi.mock("@/components/faq-page-json-ld", () => ({ default: () => null }));
vi.mock("@/sanity/lib/fetch", () => ({
  fetchBlogIndex: vi.fn(),
  fetchLatestPost: vi.fn(),
  fetchRegularPosts: vi.fn(),
  fetchRegularPostsCount: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not found");
  },
}));

const image = {
  _type: "image" as const,
  alt: "Campers paddling",
  asset: {
    _id: "image-abc-1600x900-jpg",
    metadata: { dimensions: { height: 900, width: 1600 }, lqip: null },
  },
};

const post = {
  _id: "post-1",
  _type: "post" as const,
  category: {
    _id: "category-1",
    slug: { current: "news" },
    title: "News",
  },
  excerpt: "A week at camp.",
  image,
  publishedAt: "2026-07-01T00:00:00.000Z",
  slug: { current: "summer-update" },
  title: "Summer update",
} as unknown as BlogPost;

describe("blog index", () => {
  it("keeps 12 regular posts per page and calculates five pages for 57 posts", () => {
    expect(BLOG_POSTS_PER_PAGE).toBe(12);
    expect(calculateBlogPagination(57, 1)).toEqual({
      currentPage: 1,
      hasNextPage: true,
      hasPreviousPage: false,
      itemsPerPage: 12,
      totalItems: 57,
      totalPages: 5,
    });
  });

  it("calculates regular-post query windows independently of the latest post", () => {
    expect(getBlogPostWindow(1)).toEqual({ end: 12, start: 0 });
    expect(getBlogPostWindow(2)).toEqual({ end: 24, start: 12 });
    expect(getBlogPostWindow(5)).toEqual({ end: 60, start: 48 });
  });

  it("passes the latest post ID as an explicit regular-list exclusion", () => {
    expect(getRegularPostQueryParams("latest-post", 2)).toEqual({
      end: 24,
      latestPostId: "latest-post",
      start: 12,
    });
  });

  it("excludes the latest post and uses deterministic query ordering", () => {
    expect(REGULAR_POSTS_QUERY).toContain("_id != $latestPostId");
    expect(REGULAR_POSTS_QUERY).toContain(`order(${blogPostOrder})`);
    expect(LATEST_POST_QUERY).toContain(`order(${blogPostOrder})[0]`);
  });

  it("uses the archive published-post rule for latest-article sections", () => {
    expect(latestArticlesQuery).toContain(publishedPostFilter);
    expect(latestArticlesQuery).toContain("publishedAt,");
    expect(latestArticlesQuery).not.toContain(
      "coalesce(publishedAt, _createdAt)",
    );
  });

  it("maps every visible listing-card field to Presentation", () => {
    render(<PostCard post={post} stega />);

    const postAttribute = documentDataAttribute({
      id: post._id,
      stega: true,
      type: "post",
    });
    const article = screen.getByRole("article");

    expect(article.querySelector("figure")).toHaveAttribute(
      "data-sanity",
      postAttribute?.("image"),
    );
    expect(screen.getByText("JUL 01, 2026")).toHaveAttribute(
      "data-sanity",
      postAttribute?.("publishedAt"),
    );
    expect(screen.getByRole("heading", { name: post.title ?? "" })).toHaveAttribute(
      "data-sanity",
      postAttribute?.("title"),
    );
    expect(screen.getByText("A week at camp.")).toHaveAttribute(
      "data-sanity",
      postAttribute?.("excerpt"),
    );
    expect(screen.queryByRole("link", { name: "News" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Summer update" })).toHaveAttribute(
      "href",
      "/post/summer-update",
    );
  });

  it("shows the newest posts up to the section limit, each linking to its post", () => {
    const articles = ["one", "two", "three", "four"].map((slug) => ({
      ...post,
      _id: `post-${slug}`,
      slug: { current: slug },
      title: `Post ${slug}`,
    }));
    const props = {
      _key: "latest",
      _type: "latestArticles",
      articles,
      background: null,
      buttons: null,
      description: null,
      eyebrow: null,
      fallbackImage: null,
      limit: 3,
      title: "Latest posts",
    } as unknown as ComponentProps<typeof LatestArticles>;

    const { container } = render(<LatestArticles {...props} />);
    const cards = container.querySelectorAll("article");
    expect(cards).toHaveLength(3);
    expect(cards[0].closest("a")).toBeNull();
    expect(
      within(cards[0] as HTMLElement).getByRole("link", { name: "Post one" }),
    ).toHaveAttribute("href", "/post/one");
    expect(screen.queryByRole("link", { name: "News" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Pagination" })).toBeNull();
  });

  it("requests bounded Sanity images for listing cards", () => {
    render(<PostCard post={post} stega={false} />);

    const renderedImage = screen.getByRole("img", { name: "Campers paddling" });
    expect(decodeURIComponent(renderedImage.getAttribute("src") ?? "")).toContain(
      "w=1200",
    );
    expect(renderedImage).toHaveAttribute(
      "sizes",
      "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
    );
  });

  it("accepts only pagination route segments greater than one", () => {
    expect(parseBlogPageSegment("2")).toBe(2);
    expect(parseBlogPageSegment("12")).toBe(12);
    for (const value of ["1", "0", "-1", "1.5", "two", "02", "", undefined]) {
      expect(parseBlogPageSegment(value)).toBeUndefined();
    }
  });

  it("rejects page one aliases and pages beyond the regular-list total", () => {
    expect(isBlogPageOutOfRange(1, 0)).toBe(false);
    expect(isBlogPageOutOfRange(2, 0)).toBe(true);
    expect(isBlogPageOutOfRange(5, 5)).toBe(false);
    expect(isBlogPageOutOfRange(6, 5)).toBe(true);
  });

  it("builds canonical pagination and category paths", () => {
    expect(getBlogPaginationUrl(1)).toBe("/blog");
    expect(getBlogPaginationUrl(2)).toBe("/blog/2");
    expect(getBlogCanonicalPath(1)).toBe("/blog");
    expect(getBlogCanonicalPath(3)).toBe("/blog/3");
    expect(getBlogPaginationUrl(1, "/blog/category/news/")).toBe(
      "/blog/category/news",
    );
    expect(getBlogPaginationUrl(2, "/blog/category/news/")).toBe(
      "/blog/category/news/2",
    );
    expect(getCategoryArchivePath("news")).toBe("/blog/category/news");
  });

  it("keeps category static generation non-empty before archive copy or pagination exists", () => {
    expect(getCategoryStaticParams([])).toEqual([
      { slug: "__missing-category__" },
    ]);
    expect(getCategoryStaticParams([{ slug: "tutorials" }])).toEqual([
      { slug: "tutorials" },
    ]);
    expect(getCategoryPaginatedStaticParams([])).toEqual([
      { page: "2", slug: "__missing-category__" },
    ]);
    expect(
      getCategoryPaginatedStaticParams([
        { slug: "tutorials", publishedPostCount: 12 },
      ]),
    ).toEqual([{ page: "2", slug: "tutorials" }]);
    expect(
      getCategoryPaginatedStaticParams([
        { slug: "tutorials", publishedPostCount: 13 },
      ]),
    ).toEqual([{ page: "2", slug: "tutorials" }]);
    expect(getCategoryStaticParams([{ slug: "/tutorials" }, { slug: "2" }])).toEqual([
      { slug: "__missing-category__" },
    ]);
  });

  it("uses one category indexability rule for post count, description, and noindex", () => {
    expect(
      isIndexableCategory({
        description: "Useful archive introduction",
        metaNoindex: false,
        publishedPostCount: 1,
      }),
    ).toBe(true);
    for (const input of [
      {
        description: "Useful archive introduction",
        metaNoindex: false,
        publishedPostCount: 0,
      },
      { description: "   ", metaNoindex: false, publishedPostCount: 1 },
      {
        description: "Useful archive introduction",
        metaNoindex: true,
        publishedPostCount: 1,
      },
    ]) {
      expect(isIndexableCategory(input)).toBe(false);
    }
  });

  it("makes metadata titles unique after page one", () => {
    expect(getBlogPageTitle("Insights", 1)).toBe("Insights");
    expect(getBlogPageTitle("Insights", 2)).toBe("Insights - Page 2");
  });

  it("reports result counts for the regular collection only", () => {
    expect(getBlogResultsLabel(1, 12, 57)).toBe("Showing 1–12 of 57 posts");
    expect(getBlogResultsLabel(5, 9, 57)).toBe("Showing 49–57 of 57 posts");
    expect(getBlogResultsLabel(1, 0, 0)).toBe("No posts");
  });

  it("hands page one's latest post and regular posts to the Blog page sections", async () => {
    vi.mocked(fetchBlogIndex).mockResolvedValueOnce({
      _id: "blogIndex",
      _type: "blogIndex",
      blocks: [],
      description: "Camp stories",
      title: "Blog",
    } as never);
    vi.mocked(fetchLatestPost).mockResolvedValueOnce(post as never);
    vi.mocked(fetchRegularPosts).mockResolvedValueOnce([]);
    vi.mocked(fetchRegularPostsCount).mockResolvedValueOnce(0);

    render(
      await BlogIndexRoute({
        currentPage: 1,
        perspective: "published",
        stega: false,
      }),
    );

    expect(vi.mocked(Blocks).mock.lastCall?.[0].blogListing).toEqual({
      featured: post,
      pagination: calculateBlogPagination(0, 1),
      posts: [],
    });
    // No Hero section: the page still has its heading for assistive tech.
    expect(screen.getByRole("heading", { level: 1, name: "Blog" })).toBeInTheDocument();
  });

  it("lists the posts even when the Blog page has no Latest Posts section yet", () => {
    const hero = { _key: "hero", _type: "innerHero" } as never;
    const cta = { _key: "cta", _type: "ctaBanner" } as never;
    const listing = { _key: "listing", _type: "latestArticles" } as never;

    expect(
      withBlogListingSection([hero, cta]).map((block) => block._type),
    ).toEqual(["innerHero", "latestArticles", "ctaBanner"]);
    expect(withBlogListingSection([]).map((block) => block._type)).toEqual([
      "latestArticles",
    ]);
    expect(withBlogListingSection([hero, listing, cta])).toEqual([
      hero,
      listing,
      cta,
    ]);
  });

  it("shows a clear empty state when the first page has only the latest post", () => {
    const props = {
      _key: "listing",
      _type: "latestArticles",
      articles: [],
      background: null,
      blogListing: {
        featured: post,
        pagination: calculateBlogPagination(0, 1),
        posts: [],
      },
      title: "All the news",
    } as unknown as ComponentProps<typeof LatestArticles>;

    render(<LatestArticles {...props} />);

    expect(screen.getByRole("link", { name: "Summer update" })).toHaveAttribute(
      "href",
      "/post/summer-update",
    );
    expect(screen.getByText("No more posts yet.")).toBeInTheDocument();
  });

  it("paginates the Blog page listing and opens later pages at the list", () => {
    const props = {
      _key: "listing",
      _type: "latestArticles",
      articles: [],
      background: null,
      blogListing: {
        featured: null,
        pagination: calculateBlogPagination(40, 2),
        posts: [post],
      },
      title: "All the news",
    } as unknown as ComponentProps<typeof LatestArticles>;

    render(<LatestArticles {...props} />);

    expect(screen.getByRole("link", { name: "Go to page 3" })).toHaveAttribute(
      "href",
      "/blog/3#latest-posts",
    );
    expect(screen.getByRole("link", { name: "Go to page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Go to previous page" })).toHaveAttribute(
      "href",
      "/blog#latest-posts",
    );
  });
});
