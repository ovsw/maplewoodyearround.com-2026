import { stegaClean } from "next-sanity";
import { postPath } from "@/lib/routes";
import type { POST_QUERY_RESULT } from "@/sanity.types";

export type BlogPostingJsonLdPost = Pick<
  NonNullable<POST_QUERY_RESULT>,
  | "title"
  | "excerpt"
  | "image"
  | "publishedAt"
  | "_updatedAt"
  | "slug"
  | "meta"
>;

export type BlogPostingJsonLd = {
  "@context": "https://schema.org";
  "@type": "BlogPosting";
  headline: string;
  description?: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  author: {
    "@type": "Organization";
    "@id": string;
  };
};

// Builds one BlogPosting from the post data already fetched for the page.
// Returns null instead of emitting invalid schema when a required field is missing.
export function createBlogPostingJsonLd(
  post: BlogPostingJsonLdPost,
  siteUrl: string,
): BlogPostingJsonLd | null {
  const headline = stegaClean(post.title)?.trim();
  const slug = stegaClean(post.slug?.current)
    ?.trim()
    .replace(/^\/+|\/+$/g, "")
    .trim();
  const path = postPath(slug);
  if (!headline || !post.publishedAt || !path) return null;

  const description =
    stegaClean(post.excerpt)?.trim() ||
    stegaClean(post.meta?.description)?.trim();
  const image =
    post.image?.asset?.url || post.meta?.image?.asset?.url || undefined;
  const dateModified =
    Date.parse(post._updatedAt) >= Date.parse(post.publishedAt)
      ? post._updatedAt
      : undefined;
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
  const url = `${normalizedSiteUrl}${path}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    datePublished: post.publishedAt,
    ...(dateModified ? { dateModified } : {}),
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    author: {
      "@type": "Organization",
      "@id": `${normalizedSiteUrl}/#organization`,
    },
  };
}

export function serializeBlogPostingJsonLd(value: BlogPostingJsonLd) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
