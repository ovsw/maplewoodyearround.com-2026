import { documentDataAttribute } from "@/components/blog-card";
import { NewsCategoryTag } from "@/components/news/news-index";
import css from "@/components/news/news.module.css";
import { urlFor } from "@/sanity/lib/image";
import type { POST_QUERY_RESULT } from "@/sanity.types";
import { ChevronRight } from "lucide-react";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";

type PostHeroProps = {
  post: NonNullable<POST_QUERY_RESULT>;
  readTime: string;
  stega: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

/** The live post header: breadcrumb, title and byline beside the photo. */
export default function PostHero({ post, readTime, stega }: PostHeroProps) {
  const { author, category, image, title } = post;
  const publishedAt = stegaClean(post.publishedAt);
  const postDataAttribute = documentDataAttribute({ id: post._id, stega, type: "post" });
  const authorDataAttribute = author
    ? documentDataAttribute({ id: author._id, stega, type: "author" })
    : undefined;
  const categoryDataAttribute = category
    ? documentDataAttribute({ id: category._id, stega, type: "category" })
    : undefined;

  return (
    <header className={css.section}>
      <div className={[css.container, css.postHeader].join(" ")}>
        <div>
          <nav aria-label="Breadcrumb">
            <ol className={css.breadcrumbs}>
              <li>
                <Link href="/news">Blog</Link>
                {category ? <ChevronRight aria-hidden size={16} /> : null}
              </li>
              {category ? (
                <li>
                  <NewsCategoryTag
                    category={category}
                    dataAttribute={categoryDataAttribute}
                  />
                </li>
              ) : null}
            </ol>
          </nav>
          {title ? (
            <h1 className={css.postTitle} data-sanity={postDataAttribute?.("title")}>
              {title}
            </h1>
          ) : null}
          {author?.name ? (
            <p className={css.byline}>
              By{" "}
              <strong data-sanity={authorDataAttribute?.("name")}>{author.name}</strong>
            </p>
          ) : null}
          <p className={css.meta}>
            {publishedAt ? (
              <>
                <time
                  data-sanity={postDataAttribute?.("publishedAt")}
                  dateTime={publishedAt}
                >
                  {formatDate(publishedAt)}
                </time>
                <span aria-hidden="true">•</span>
              </>
            ) : null}
            <span>{readTime}</span>
          </p>
        </div>
        {image?.asset?._id ? (
          <figure className={css.postImage} data-sanity={postDataAttribute?.("image")}>
            <Image
              alt={stegaClean(image.alt) || ""}
              blurDataURL={image.asset.metadata?.lqip || undefined}
              height={image.asset.metadata?.dimensions?.height ?? 900}
              placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
              preload
              sizes="(max-width: 991px) 90vw, 50vw"
              src={urlFor(image).width(1600).quality(90).url()}
              width={image.asset.metadata?.dimensions?.width ?? 1600}
            />
          </figure>
        ) : null}
      </div>
    </header>
  );
}
