import { type QueryParams } from "next-sanity";
import { sanityFetch, type DynamicFetchOptions } from "@/sanity/lib/live";
import { PAGE_QUERY, PAGES_SLUGS_QUERY } from "@/sanity/queries/page";
import { NAVIGATION_QUERY } from "@/sanity/queries/navigation";
import { SETTINGS_QUERY } from "@/sanity/queries/settings";
import { BLOG_POST_SETTINGS_QUERY } from "@/sanity/queries/blog-post-settings";
import { FOOTER_QUERY } from "@/sanity/queries/footer";
import { HOME_PAGE_QUERY } from "@/sanity/queries/home-page";
import {
  PUBLISHED_POST_QUERY,
  POST_QUERY,
  POSTS_QUERY,
  POSTS_SLUGS_QUERY,
} from "@/sanity/queries/post";
import type {
  BLOG_INDEX_QUERY_RESULT,
  BLOG_POST_SETTINGS_QUERY_RESULT,
  FOOTER_QUERY_RESULT,
  HOME_PAGE_QUERY_RESULT,
  NAVIGATION_QUERY_RESULT,
  PAGE_QUERY_RESULT,
  POSTS_QUERY_RESULT,
  POST_QUERY_RESULT,
  SETTINGS_QUERY_RESULT,
} from "@/sanity.types";
import type { BlogPost } from "@/sanity/queries/blog-index";
import type { CategoryArchive } from "@/sanity/queries/category";
import {
  BLOG_INDEX_QUERY,
  LATEST_POST_QUERY,
  REGULAR_POSTS_COUNT_QUERY,
  REGULAR_POSTS_QUERY,
} from "@/sanity/queries/blog-index";
import {
  CATEGORY_POSTS_COUNT_QUERY,
  CATEGORY_POSTS_QUERY,
  CATEGORY_QUERY,
} from "@/sanity/queries/category";

async function fetchCached<QueryResult>({
  params = {},
  perspective,
  query,
  stega,
}: {
  params?: QueryParams;
  query: string;
} & DynamicFetchOptions): Promise<QueryResult> {
  "use cache";
  const { data } = await sanityFetch({ query, params, perspective, stega });
  return data as QueryResult;
}

export function fetchSanityPageBySlug({
  slug,
  perspective,
  stega,
}: { slug: string } & DynamicFetchOptions): Promise<PAGE_QUERY_RESULT> {
  return fetchCached({ query: PAGE_QUERY, params: { slug }, perspective, stega });
}

export function fetchHomePage({
  perspective,
  stega,
}: DynamicFetchOptions): Promise<HOME_PAGE_QUERY_RESULT> {
  return fetchCached({ query: HOME_PAGE_QUERY, perspective, stega });
}

export function fetchSanityPosts({
  perspective,
  stega,
}: DynamicFetchOptions): Promise<POSTS_QUERY_RESULT> {
  return fetchCached({ query: POSTS_QUERY, perspective, stega });
}

export function fetchBlogIndex({
  perspective,
  stega,
}: DynamicFetchOptions): Promise<BLOG_INDEX_QUERY_RESULT> {
  return fetchCached({ query: BLOG_INDEX_QUERY, perspective, stega });
}

export function fetchLatestPost({
  perspective,
  stega,
}: DynamicFetchOptions): Promise<BlogPost | null> {
  return fetchCached({ query: LATEST_POST_QUERY, perspective, stega });
}

export function fetchRegularPosts({
  end,
  latestPostId,
  perspective,
  start,
  stega,
}: {
  end: number;
  latestPostId: string;
  start: number;
} & DynamicFetchOptions): Promise<BlogPost[]> {
  return fetchCached({
    query: REGULAR_POSTS_QUERY,
    params: { end, latestPostId, start },
    perspective,
    stega,
  });
}

export function fetchRegularPostsCount({
  latestPostId,
  perspective,
  stega,
}: { latestPostId: string } & DynamicFetchOptions): Promise<number> {
  return fetchCached({
    query: REGULAR_POSTS_COUNT_QUERY,
    params: { latestPostId },
    perspective,
    stega,
  });
}

export function fetchCategory({
  perspective,
  slug,
  stega,
}: { slug: string } & DynamicFetchOptions): Promise<CategoryArchive | null> {
  return fetchCached({ query: CATEGORY_QUERY, params: { slug }, perspective, stega });
}

export function fetchCategoryPosts({
  categoryId,
  end,
  perspective,
  start,
  stega,
}: {
  categoryId: string;
  end: number;
  start: number;
} & DynamicFetchOptions): Promise<BlogPost[]> {
  return fetchCached({
    query: CATEGORY_POSTS_QUERY,
    params: { categoryId, end, start },
    perspective,
    stega,
  });
}

export function fetchCategoryPostsCount({
  categoryId,
  perspective,
  stega,
}: { categoryId: string } & DynamicFetchOptions): Promise<number> {
  return fetchCached({
    query: CATEGORY_POSTS_COUNT_QUERY,
    params: { categoryId },
    perspective,
    stega,
  });
}

export function fetchSanityPostBySlug({
  slug,
  perspective,
  stega,
}: { slug: string } & DynamicFetchOptions): Promise<POST_QUERY_RESULT> {
  return fetchCached({
    query: perspective === "published" ? PUBLISHED_POST_QUERY : POST_QUERY,
    params: { slug },
    perspective,
    stega,
  });
}

export function fetchSanityNavigation({
  perspective,
  stega,
}: DynamicFetchOptions): Promise<NAVIGATION_QUERY_RESULT> {
  return fetchCached({ query: NAVIGATION_QUERY, perspective, stega });
}

export function fetchSanitySettings({
  perspective,
  stega,
}: DynamicFetchOptions): Promise<SETTINGS_QUERY_RESULT> {
  return fetchCached({ query: SETTINGS_QUERY, perspective, stega });
}

export function fetchBlogPostSettings({
  perspective,
  stega,
}: DynamicFetchOptions): Promise<BLOG_POST_SETTINGS_QUERY_RESULT> {
  return fetchCached({ query: BLOG_POST_SETTINGS_QUERY, perspective, stega });
}

export function fetchSanityFooter({
  perspective,
  stega,
}: DynamicFetchOptions): Promise<FOOTER_QUERY_RESULT> {
  return fetchCached({ query: FOOTER_QUERY, perspective, stega });
}

export async function getCurrentYear(): Promise<number> {
  "use cache";
  return new Date().getFullYear();
}

export { PAGES_SLUGS_QUERY, POSTS_SLUGS_QUERY };
