import { BlogIndexRoute } from "../_components/blog-index-route";
import { BlogPostRoute } from "../_components/blog-post-route";
import {
  calculateBlogPagination,
  parseBlogPageSegment,
} from "@/lib/blog-index";
import { isApplicationPath, isRouteSlug, postPath } from "@/lib/routes";
import { POSTS_SLUGS_QUERY } from "@/sanity/lib/fetch";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@/sanity/lib/live";
import {
  generateBlogIndexMetadata,
  generatePageMetadata,
} from "@/sanity/lib/metadata";
import { fetchSeoSettings } from "@/sanity/lib/seo-settings";
import {
  BLOG_INDEX_QUERY,
  ELIGIBLE_BLOG_POSTS_COUNT_QUERY,
} from "@/sanity/queries/blog-index";
import { PUBLISHED_POST_QUERY } from "@/sanity/queries/post";
import type {
  BLOG_INDEX_QUERY_RESULT,
  POSTS_SLUGS_QUERY_RESULT,
  POST_QUERY_RESULT,
} from "@/sanity.types";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ page: string }> };

export const instant = false;

function readPostSlug(segment: string) {
  const path = postPath(segment);
  return isRouteSlug(segment) && path && !isApplicationPath(path)
    ? segment
    : null;
}

export async function generateStaticParams() {
  const [{ data: count }, { data: posts }] = await Promise.all([
    sanityFetchStaticParams({ query: ELIGIBLE_BLOG_POSTS_COUNT_QUERY }),
    sanityFetchStaticParams({ query: POSTS_SLUGS_QUERY }) as Promise<{
      data: POSTS_SLUGS_QUERY_RESULT;
    }>,
  ]);
  const regularPostCount = Math.max(Number(count) - 1, 0);
  const { totalPages } = calculateBlogPagination(regularPostCount, 1);
  const params = Array.from(
    { length: Math.max(totalPages - 1, 0) },
    (_, index) => ({ page: String(index + 2) }),
  );

  for (const post of posts) {
    const slug = post.slug?.current?.replace(/^\/+|\/+$/g, "");
    if (slug && readPostSlug(slug)) params.push({ page: slug });
  }

  // Cache Components requires a build sample, even for an empty dataset.
  // This invalid slug takes the normal notFound path and creates no content.
  return params.length ? params : [{ page: "__placeholder__" }];
}

export async function generateMetadata({ params }: Props) {
  const { page: segment } = await params;
  const page = parseBlogPageSegment(segment);
  if (page) {
    const [{ data: blogIndex }, settings] = await Promise.all([
      sanityFetchMetadata({
        query: BLOG_INDEX_QUERY,
        perspective: "published",
      }) as Promise<{ data: BLOG_INDEX_QUERY_RESULT }>,
      fetchSeoSettings(),
    ]);
    return generateBlogIndexMetadata({ blogIndex, page, settings });
  }
  if (/^\d+$/.test(segment)) notFound();

  const slug = readPostSlug(segment);
  if (!slug) notFound();
  const [{ data: post }, settings] = await Promise.all([
    sanityFetchMetadata({
      query: PUBLISHED_POST_QUERY,
      params: { slug },
      perspective: "published",
    }) as Promise<{ data: POST_QUERY_RESULT }>,
    fetchSeoSettings(),
  ]);
  if (!post) return {};
  const path = postPath(slug);
  if (!path) return {};
  return generatePageMetadata({ page: post, path, settings });
}

export default async function BlogSegmentPage({ params }: Props) {
  const [{ page: segment }, { isEnabled }] = await Promise.all([
    params,
    draftMode(),
  ]);
  const page = parseBlogPageSegment(segment);
  if (page) {
    return isEnabled ? (
      <DynamicBlogIndexPage page={page} />
    ) : (
      <BlogIndexRoute currentPage={page} perspective="published" stega={false} />
    );
  }
  if (/^\d+$/.test(segment)) notFound();

  const slug = readPostSlug(segment);
  if (!slug) notFound();
  return isEnabled ? (
    <DynamicBlogPostPage slug={slug} />
  ) : (
    <BlogPostRoute slug={slug} perspective="published" stega={false} />
  );
}

async function DynamicBlogIndexPage({ page }: { page: number }) {
  const options = await getDynamicFetchOptions();
  return <BlogIndexRoute currentPage={page} {...options} />;
}

async function DynamicBlogPostPage({ slug }: { slug: string }) {
  const options = await getDynamicFetchOptions();
  return <BlogPostRoute slug={slug} {...options} />;
}
