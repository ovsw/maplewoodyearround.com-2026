import Blocks from "@/components/blocks";
import BreadcrumbJsonLd from "@/components/breadcrumb-json-ld";
import FaqPageJsonLd from "@/components/faq-json-ld";
import {
  calculateBlogPagination,
  getRegularPostQueryParams,
  getBlogCanonicalPath,
  isBlogPageOutOfRange,
} from "@/lib/blog-index";
import {
  fetchBlogIndex,
  fetchLatestPost,
  fetchRegularPosts,
  fetchRegularPostsCount,
} from "@/sanity/lib/fetch";
import type { DynamicFetchOptions } from "@/sanity/lib/live";
import type { BLOG_INDEX_QUERY_RESULT } from "@/sanity.types";
import { notFound } from "next/navigation";
import { siteUrl } from "@/lib/site-url";

type BlogIndexBlock = NonNullable<
  NonNullable<BLOG_INDEX_QUERY_RESULT>["blocks"]
>[number];

/** Stands in until the Blog page holds its own Latest Posts section. */
const fallbackListingSection: Extract<BlogIndexBlock, { _type: "latestArticles" }> = {
  _key: "blog-listing-fallback",
  _type: "latestArticles",
  articles: [],
  background: "white",
  buttons: null,
  description: null,
  eyebrow: null,
  fallbackImage: null,
  limit: null,
  title: "All posts",
};

/**
 * Studio requires one Latest Posts section on the Blog page, but a stored
 * document from before that rule has none. Add one after the Hero so the
 * posts always list.
 */
export function withBlogListingSection(blocks: BlogIndexBlock[]) {
  if (blocks.some((block) => block._type === "latestArticles")) return blocks;
  const heroCount = blocks[0]?._type === "hero" || blocks[0]?._type === "innerHero" ? 1 : 0;
  return [
    ...blocks.slice(0, heroCount),
    fallbackListingSection,
    ...blocks.slice(heroCount),
  ];
}

/*
 * The Blog page is built from its Page Builder sections: the Hero, the
 * Latest Posts section, and whatever follows. The route owns the page
 * number and the post queries, and hands one page of posts to the Latest
 * Posts section through `blogListing`.
 */
export async function BlogIndexRoute({
  currentPage,
  perspective,
  stega,
}: { currentPage: number } & DynamicFetchOptions) {
  const [blogIndex, latestPost] = await Promise.all([
    fetchBlogIndex({ perspective, stega }),
    fetchLatestPost({ perspective, stega }),
  ]);
  if (!blogIndex) notFound();

  const latestPostId = latestPost?._id || "";
  const queryParams = getRegularPostQueryParams(latestPostId, currentPage);
  const [regularPosts, regularPostCount] = latestPost
    ? await Promise.all([
        fetchRegularPosts({ ...queryParams, perspective, stega }),
        fetchRegularPostsCount({ latestPostId, perspective, stega }),
      ])
    : [[], 0];
  const pagination = calculateBlogPagination(regularPostCount, currentPage);
  if (isBlogPageOutOfRange(currentPage, pagination.totalPages)) {
    notFound();
  }
  const blocks = withBlogListingSection(blogIndex.blocks ?? []);
  const hasHero = blocks.some(
    (block) => block._type === "hero" || block._type === "innerHero",
  );

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: getBlogCanonicalPath(currentPage) },
        ]}
        siteUrl={siteUrl}
      />
      <FaqPageJsonLd blocks={blogIndex.blocks ?? []} />
      {/* The Hero carries the page heading; without one, keep an outline. */}
      {!hasHero ? <h1 className="sr-only">{blogIndex.title}</h1> : null}
      <Blocks
        blocks={blocks}
        blogListing={{
          featured: currentPage === 1 ? latestPost : null,
          pagination,
          posts: regularPosts,
        }}
        documentId={blogIndex._id}
        documentType="blogIndex"
        perspective={perspective}
        stega={stega}
      />
    </>
  );
}
