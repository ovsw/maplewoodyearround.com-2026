import { FeaturedPostCard, PostGrid } from "@/components/blog-card";
import BlogPagination from "@/components/blog-pagination";
import { getBlogResultsLabel, type BlogListing } from "@/lib/blog-index";
import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { ArrowRight } from "lucide-react";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import { sectionThemeClass } from "./section-theme";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type LatestArticlesProps = Extract<PageBlock, { _type: "latestArticles" }> & {
  /** Set on the Blog page: every post, one page at a time. */
  blogListing?: BlogListing;
  dataAttribute?: (path: string) => string | undefined;
};

/** The query returns the newest 12 posts; the editor picks how many show. */
const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 12;

/** The Blog page list's id; its links to page 2 and on land here. */
const LISTING_ID = "latest-posts";

/** The field utility on the section root re-points the job tokens, so only
 *  the secondary-text recipes, whose alpha differs on Green, stay here. */
const fields = {
  dark: {
    description: "text-foreground/70",
    muted: "text-foreground/70",
  },
  light: {
    description: "text-muted-foreground",
    muted: "text-muted-foreground",
  },
} as const;

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

export function resolvePostLimit(limit?: number | null) {
  const value = Number(stegaClean(limit));
  if (!Number.isInteger(value) || value < 1) return DEFAULT_LIMIT;
  return Math.min(value, MAX_LIMIT);
}

/*
 * Latest Posts — built from shadcnblocks blog47 (heading row with an
 * all-posts link over a three-column card grid) and blog53 (the wide
 * featured post). On a page it shows the newest few posts. On the Blog page
 * the route hands it `blogListing`: page one leads with the newest post
 * large, and every page ends with pagination.
 */
export default function LatestArticles({
  _key,
  articles,
  background,
  blogListing,
  buttons,
  dataAttribute,
  description,
  eyebrow,
  fallbackImage,
  limit,
  title,
}: LatestArticlesProps) {
  const posts = blogListing
    ? blogListing.posts
    : (articles ?? []).slice(0, resolvePostLimit(limit));
  if (!blogListing && !posts.length) return null;

  const tone = stegaClean(background) === "green" ? "dark" : "light";
  const field = fields[tone];
  const headingId = `latest-posts-${stegaClean(_key)}-title`;
  const button = blogListing ? undefined : buttons?.[0];
  const buttonHref = getSafeLinkHref(button?.href);
  const buttonLabel = stegaClean(button?.text)?.trim();
  const featured = blogListing?.featured ?? null;
  // The dispatcher passes `dataAttribute` only when Presentation editing is on.
  const stega = Boolean(dataAttribute);

  return (
    <section
      aria-labelledby={headingId}
      className={cn("py-section", sectionThemeClass(background))}
      id={blogListing ? LISTING_ID : `latest-posts-${stegaClean(_key)}`}
    >
      <div className="container-content">
        <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            {hasText(eyebrow) ? (
              <p
                className="mb-5 text-eyebrow text-link"
                data-sanity={dataAttribute?.("eyebrow")}
              >
                {eyebrow}
              </p>
            ) : null}
            <h2
              className="text-balance font-display text-headline"
              data-sanity={dataAttribute?.("title")}
              id={headingId}
            >
              {title}
            </h2>
            {hasText(description) ? (
              <p
                className={cn("mt-5 max-w-xl text-pretty text-lg/relaxed", field.description)}
                data-sanity={dataAttribute?.("description")}
              >
                {description}
              </p>
            ) : null}
          </div>
          {button && buttonHref && buttonLabel ? (
            <Link
              className="focus-ring group/link inline-flex w-fit shrink-0 items-center gap-2 font-semibold text-prose-link underline-offset-4 decoration-current/40 hover:text-prose-link-hover hover:underline"
              data-sanity={dataAttribute?.(`buttons[_key=="${button._key}"]`)}
              href={buttonHref}
              rel={stegaClean(button.openInNewTab) ? "noopener noreferrer" : undefined}
              target={stegaClean(button.openInNewTab) ? "_blank" : undefined}
            >
              {buttonLabel}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-200 group-hover/link:translate-x-1 motion-reduce:transition-none"
              />
            </Link>
          ) : null}
        </header>

        {featured ? (
          <div className="mb-6">
            <FeaturedPostCard
              fallbackImage={fallbackImage}
              post={featured}
              stega={stega}
              tone={tone}
            />
          </div>
        ) : null}

        {posts.length ? (
          <PostGrid
            fallbackImage={fallbackImage}
            posts={posts}
            stega={stega}
            tone={tone}
          />
        ) : (
          <p className={cn("text-lg", field.muted)}>
            {featured ? "No more posts yet." : "No posts yet."}
          </p>
        )}

        {blogListing && posts.length ? (
          <footer className="mt-14 flex flex-col items-center gap-5">
            <p className={cn("text-label tabular-nums", field.muted)}>
              {getBlogResultsLabel(
                blogListing.pagination.currentPage,
                posts.length,
                blogListing.pagination.totalItems,
              )}
            </p>
            <BlogPagination
              hash={LISTING_ID}
              onDark={tone === "dark"}
              pagination={blogListing.pagination}
            />
          </footer>
        ) : null}
      </div>
    </section>
  );
}
