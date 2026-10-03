import {
  documentDataAttribute,
  PublicationDate,
} from "@/components/blog-card";
import { urlFor } from "@/sanity/lib/image";
import type { POST_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
import { categoryPath } from "@/lib/routes";

type PostHeroProps = {
  post: NonNullable<POST_QUERY_RESULT>;
  readTime: string;
  stega: boolean;
};

function getInitials(value: string | null | undefined) {
  const name = stegaClean(value)?.trim();
  if (!name) return "A";

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function PostHero({ post, readTime, stega }: PostHeroProps) {
  const { author, category, excerpt, image, publishedAt, title } = post;
  const categorySlug = stegaClean(category?.slug?.current)?.replace(/^\/+|\/+$/g, "");
  const categoryHref = categoryPath(categorySlug);
  const authorName = stegaClean(author?.name)?.trim();
  const postDataAttribute = documentDataAttribute({ id: post._id, stega, type: "post" });
  const authorDataAttribute = author
    ? documentDataAttribute({ id: author._id, stega, type: "author" })
    : undefined;
  const categoryDataAttribute = category
    ? documentDataAttribute({ id: category._id, stega, type: "category" })
    : undefined;

  return (
    <>
      <header>
        {category?.title && categoryHref ? (
          <Link
            data-sanity={categoryDataAttribute?.("title")}
            href={categoryHref}
          >
            {category.title}
          </Link>
        ) : null}
        {title ? (
          <h1 data-sanity={postDataAttribute?.("title")}>
            {title}
          </h1>
        ) : null}
        {excerpt ? (
          <p data-sanity={postDataAttribute?.("excerpt")}>
            {excerpt}
          </p>
        ) : null}
        <div>
          {author ? (
            <p>
              {author.image?.asset?._id ? (
                <span data-sanity={authorDataAttribute?.("image")}>
                  <Image
                    alt={stegaClean(author.image.alt) || authorName || "Post author"}
                    blurDataURL={author.image.asset.metadata?.lqip || undefined}
                    height={40}
                    placeholder={author.image.asset.metadata?.lqip ? "blur" : undefined}
                    sizes="40px"
                    src={urlFor(author.image).width(80).height(80).quality(100).url()}
                    width={40}
                  />
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  data-sanity={authorDataAttribute?.("image")}
                >
                  {getInitials(author.name)}
                </span>
              )}
              {author.name ? (
                <span data-sanity={authorDataAttribute?.("name")}>
                  {author.name}
                </span>
              ) : null}
            </p>
          ) : null}
          <p>
            <PublicationDate dataAttribute={postDataAttribute} value={publishedAt} />
            {publishedAt ? <span aria-hidden="true">•</span> : null}
            <span>{readTime}</span>
          </p>
        </div>
      </header>
      {image?.asset?._id ? (
        <figure data-sanity={postDataAttribute?.("image")}>
          <Image
            alt={stegaClean(image.alt) || ""}
            blurDataURL={image.asset.metadata?.lqip || undefined}
            height={image.asset.metadata?.dimensions?.height ?? 900}
            placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
            sizes="(min-width: 1280px) 1280px, calc(100vw - 2rem)"
            src={urlFor(image).quality(100).url()}
            width={image.asset.metadata?.dimensions?.width ?? 1600}
          />
        </figure>
      ) : null}
    </>
  );
}
