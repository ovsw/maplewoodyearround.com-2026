import { PostGrid, documentDataAttribute } from "@/components/blog-card";
import BreadcrumbJsonLd from "@/components/breadcrumb-json-ld";
import BlogPagination from "@/components/blog-pagination";
import {
  calculateBlogPagination,
  getBlogPostWindow,
  getBlogResultsLabel,
  getBlogCanonicalPath,
  getCategoryArchivePath,
  isBlogPageOutOfRange,
} from "@/lib/blog-index";
import {
  fetchCategory,
  fetchCategoryPosts,
  fetchCategoryPostsCount,
} from "@/sanity/lib/fetch";
import type { DynamicFetchOptions } from "@/sanity/lib/live";
import { notFound } from "next/navigation";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import { siteUrl } from "@/lib/site-url";

export async function CategoryArchiveRoute({
  currentPage,
  perspective,
  slug,
  stega,
}: { currentPage: number; slug: string } & DynamicFetchOptions) {
  const category = await fetchCategory({ perspective, slug, stega });
  if (!category) notFound();

  const [posts, postCount] = await Promise.all([
    fetchCategoryPosts({
      categoryId: category._id,
      ...getBlogPostWindow(currentPage),
      perspective,
      stega,
    }),
    fetchCategoryPostsCount({ categoryId: category._id, perspective, stega }),
  ]);
  const pagination = calculateBlogPagination(postCount, currentPage);
  if (isBlogPageOutOfRange(currentPage, pagination.totalPages)) notFound();

  const title = stegaClean(category.title) || "Blog category";
  const description = stegaClean(category.description);
  const fieldDataAttribute = documentDataAttribute({
    id: category._id,
    stega,
    type: "category",
  });
  const basePath = getCategoryArchivePath(stegaClean(category.slug?.current) || slug);
  const canonicalPath = getBlogCanonicalPath(currentPage, basePath);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: title, path: canonicalPath },
        ]}
        siteUrl={siteUrl}
      />
      {/* One section outside the Page Builder: its bottom is an edge above
          the tucking footer, so it adds the overlap like the resolver does. */}
      <section
        aria-labelledby="category-title"
        className="field-white py-section [--section-pad-bottom:calc(var(--section-pad)+var(--section-overlap))]"
      >
        <div className="container-content">
          <header className="mb-12 max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-5 text-eyebrow text-link">
              <Link className="focus-ring underline-offset-4 hover:underline" href="/blog">
                Blog
              </Link>
              <span aria-hidden="true"> / </span>
              <span>{title}</span>
            </nav>
            <h1
              className="text-balance font-display text-headline"
              data-sanity={fieldDataAttribute?.("title")}
              id="category-title"
            >
              {category.title}
            </h1>
            {description?.trim() ? (
              <p
                className="mt-5 max-w-xl text-pretty text-lg/relaxed text-muted-foreground"
                data-sanity={fieldDataAttribute?.("description")}
              >
                {category.description}
              </p>
            ) : null}
          </header>

          <h2 className="sr-only">Posts in {title}</h2>
          {posts.length ? (
            <PostGrid posts={posts} stega={stega} />
          ) : (
            <p className="text-lg text-muted-foreground">No posts in this category yet.</p>
          )}
          {posts.length ? (
            <footer className="mt-14 flex flex-col items-center gap-5">
              <p className="text-label tabular-nums text-muted-foreground">
                {getBlogResultsLabel(currentPage, posts.length, postCount)}
              </p>
              <BlogPagination basePath={basePath} pagination={pagination} />
            </footer>
          ) : null}
        </div>
      </section>
    </>
  );
}
