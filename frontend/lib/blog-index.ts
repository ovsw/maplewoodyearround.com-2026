import type { BlogPost } from "@/sanity/queries/blog-index";

export const BLOG_POSTS_PER_PAGE = 12;

export type BlogPagination = {
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
};

/**
 * One page of the Blog page's post list. The route owns the page number, the
 * range check, and the queries; its Latest Posts section only renders this.
 */
export type BlogListing = {
  /** The newest post, shown large on page one only. */
  featured: BlogPost | null;
  pagination: BlogPagination;
  posts: BlogPost[];
};

export function parseBlogPageSegment(value: string | undefined) {
  if (!value || !/^[1-9]\d*$/.test(value)) return undefined;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 1 ? page : undefined;
}

export function getBlogPostWindow(page: number) {
  const start = (page - 1) * BLOG_POSTS_PER_PAGE;
  return { start, end: start + BLOG_POSTS_PER_PAGE };
}

export function getRegularPostQueryParams(latestPostId: string, page: number) {
  return { latestPostId, ...getBlogPostWindow(page) };
}

export function isBlogPageOutOfRange(page: number, totalPages: number) {
  return page > 1 && (totalPages === 0 || page > totalPages);
}

export function calculateBlogPagination(
  totalItems: number,
  currentPage: number,
): BlogPagination {
  const totalPages = Math.ceil(totalItems / BLOG_POSTS_PER_PAGE);
  return {
    currentPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    itemsPerPage: BLOG_POSTS_PER_PAGE,
    totalItems,
    totalPages,
  };
}

export function getBlogPaginationUrl(page: number, basePath = "/blog") {
  const normalizedBasePath = `/${basePath.replace(/^\/+|\/+$/g, "")}`;
  return page === 1 ? normalizedBasePath : `${normalizedBasePath}/${page}`;
}

export const getBlogCanonicalPath = getBlogPaginationUrl;

export function getCategoryArchivePath(slug: string) {
  return `/blog/category/${slug.replace(/^\/+|\/+$/g, "")}`;
}

export function isIndexableCategory({
  description,
  metaNoindex,
  publishedPostCount,
}: {
  description?: string | null;
  metaNoindex?: boolean | null;
  publishedPostCount: number;
}) {
  return publishedPostCount > 0 && Boolean(description?.trim()) && !metaNoindex;
}

type CategoryStaticParamSource = {
  publishedPostCount: number;
  slug: string;
};

const CATEGORY_STATIC_PARAM_SENTINEL = "__missing-category__";

function hasValidCategorySlug({ slug }: Pick<CategoryStaticParamSource, "slug">) {
  return (
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    !/^\d+$/.test(slug)
  );
}

export function getCategoryStaticParams(
  categories: Array<Pick<CategoryStaticParamSource, "slug">>,
) {
  const params = categories
    .filter(hasValidCategorySlug)
    .map(({ slug }) => ({ slug }));
  return params.length ? params : [{ slug: CATEGORY_STATIC_PARAM_SENTINEL }];
}

export function getCategoryPaginatedStaticParams(
  categories: CategoryStaticParamSource[],
) {
  const validCategories = categories.filter(hasValidCategorySlug);
  const params = validCategories.flatMap(({ publishedPostCount, slug }) => {
    const { totalPages } = calculateBlogPagination(publishedPostCount, 1);
    return Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) => ({
      page: String(index + 2),
      slug,
    }));
  });

  return params.length
    ? params
    : [{ page: "2", slug: validCategories[0]?.slug || CATEGORY_STATIC_PARAM_SENTINEL }];
}

export function getBlogPageTitle(title: string, page: number) {
  return page > 1 ? `${title} - Page ${page}` : title;
}

export function getBlogPageDescription(
  description: string | undefined,
  page: number,
) {
  if (!description || page === 1) return description;
  return `${description.trimEnd()} Page ${page}.`;
}

export function getBlogResultsLabel(
  currentPage: number,
  displayedItems: number,
  totalItems: number,
) {
  if (totalItems <= 0 || displayedItems <= 0) return "No posts";
  const start = (currentPage - 1) * BLOG_POSTS_PER_PAGE + 1;
  const end = Math.min(start + displayedItems - 1, totalItems);
  return `Showing ${start}\u2013${end} of ${totalItems} posts`;
}

export function generateBlogPaginationItems(
  currentPage: number,
  totalPages: number,
) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];
  if (currentPage > 4) items.push("ellipsis");
  for (
    let page = Math.max(2, currentPage - 2);
    page <= Math.min(totalPages - 1, currentPage + 2);
    page += 1
  ) {
    items.push(page);
  }
  if (currentPage < totalPages - 3) items.push("ellipsis");
  items.push(totalPages);
  return items;
}
