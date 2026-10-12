import { ChevronRight } from "lucide-react";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
import { documentDataAttribute } from "@/components/blog-card";
import BlogPagination from "@/components/blog-pagination";
import { formatReadTime } from "@/components/post-sidebar/model";
import type { BlogListing } from "@/lib/blog-index";
import { postPath } from "@/lib/routes";
import { urlFor } from "@/sanity/lib/image";
import type { BlogPost } from "@/sanity/queries/blog-index";
import css from "./news.module.css";

type DataAttribute = (path: string) => string | undefined;

/** The live listing's two date styles: "1 Oct 2026" and "October 1, 2026". */
function formatDate(value: string, featured: boolean) {
  return new Intl.DateTimeFormat(featured ? "en-GB" : "en-US", {
    day: "numeric",
    month: featured ? "short" : "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

export function NewsCategoryTag({
  category,
  dataAttribute,
}: {
  category?: BlogPost["category"];
  dataAttribute?: DataAttribute;
}) {
  if (!stegaClean(category?.title)?.trim()) return null;
  return (
    <span
      className={css.tag}
      data-sanity={dataAttribute?.("title")}
      style={{ backgroundColor: stegaClean(category?.color) || undefined }}
    >
      {category?.title}
    </span>
  );
}

function NewsCard({
  featured = false,
  post,
  stega,
}: {
  featured?: boolean;
  post: BlogPost;
  stega: boolean;
}) {
  const href = postPath(stegaClean(post.slug?.current));
  const publishedAt = stegaClean(post.publishedAt);
  const postAttribute = documentDataAttribute({ id: post._id, stega, type: "post" });
  const categoryAttribute = post.category
    ? documentDataAttribute({ id: post.category._id, stega, type: "category" })
    : undefined;
  const author = post.author;
  const role = stegaClean(author?.role)?.trim();

  return (
    <article
      className={[css.card, featured ? css.featured : ""].join(" ")}
      data-sanity={postAttribute?.("title")}
    >
      {post.image?.asset?._id ? (
        <Image
          alt=""
          className={css.cardImage}
          height={featured ? 600 : 533}
          sizes={
            featured
              ? "(max-width: 767px) 90vw, 45vw"
              : "(max-width: 767px) 90vw, (max-width: 991px) 45vw, 30vw"
          }
          src={urlFor(post.image).width(1200).url()}
          width={800}
        />
      ) : null}
      <div className={css.cardContent}>
        <div>
          <NewsCategoryTag category={post.category} dataAttribute={categoryAttribute} />
          <h2 className={css.cardTitle}>
            {href ? <Link href={href}>{post.title}</Link> : post.title}
          </h2>
          {post.excerpt ? (
            <p className={css.cardExcerpt}>
              {/* Stega markers count as whitespace; keep them intact. */}
              {stega ? post.excerpt : post.excerpt.replace(/\s*\n+\s*/g, " ")}
            </p>
          ) : null}
        </div>
        <div className={css.author}>
          {author?.image?.asset?._id ? (
            <Image
              alt=""
              className={css.authorImage}
              height={64}
              sizes="64px"
              src={urlFor(author.image).width(128).height(128).url()}
              width={64}
            />
          ) : null}
          <div>
            {author?.name ? (
              <p className={css.authorName}>
                {author.name}
                {featured && role ? ` | ${author.role}` : null}
              </p>
            ) : null}
            {publishedAt ? (
              <p className={css.meta}>
                <time dateTime={publishedAt}>{formatDate(publishedAt, featured)}</time>
                {featured ? (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>{formatReadTime(post.wordCount)}</span>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * The News page: its heading, the newest post large, then the other posts
 * as cards. The route owns the page number and the post queries.
 */
export default function NewsIndex({
  blogListing,
  dataAttribute,
  description,
  eyebrow,
  title,
}: {
  blogListing: BlogListing;
  dataAttribute?: DataAttribute;
  description?: string | null;
  eyebrow?: string | null;
  title?: string | null;
}) {
  // The dispatcher passes `dataAttribute` only when Presentation editing is on.
  const stega = Boolean(dataAttribute);
  const { featured, pagination, posts } = blogListing;

  return (
    <section className={css.section} id="latest-posts">
      <div className={css.container}>
        <header className={css.intro}>
          {stegaClean(eyebrow)?.trim() ? (
            <p className={css.tagline} data-sanity={dataAttribute?.("eyebrow")}>
              {eyebrow}
            </p>
          ) : null}
          <nav aria-label="Breadcrumb">
            <ol className={css.breadcrumbs}>
              <li>
                <Link href="/">Home</Link>
                <ChevronRight aria-hidden size={16} />
              </li>
            </ol>
          </nav>
          <h1 className={css.title} data-sanity={dataAttribute?.("title")}>
            {title}
          </h1>
          {stegaClean(description)?.trim() ? (
            <p className={css.description} data-sanity={dataAttribute?.("description")}>
              {description}
            </p>
          ) : null}
        </header>

        {featured ? <NewsCard featured post={featured} stega={stega} /> : null}

        {posts.length ? (
          <div className={css.grid}>
            {posts.map((post) => (
              <NewsCard key={post._id} post={post} stega={stega} />
            ))}
          </div>
        ) : featured ? null : (
          <p className={css.empty}>No news yet.</p>
        )}

        {pagination.totalPages > 1 ? (
          <div className={css.pagination}>
            <BlogPagination hash="latest-posts" pagination={pagination} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
