import { postPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { dataset, projectId } from "@/sanity/lib/env";
import { urlFor } from "@/sanity/lib/image";
import type { BlogPost } from "@/sanity/queries/blog-index";
import { ArrowRight } from "lucide-react";
import { createDataAttribute, stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";

type DataAttribute = (path: string) => string | undefined;
type PostImage = BlogPost["image"];

/**
 * Card colours for the field a list sits on. Light cards work on the white
 * and cream fields; dark cards on the green field.
 */
export type PostCardTone = "dark" | "light";

const tones = {
  dark: {
    card: "border-foreground/15 bg-card text-card-foreground",
    media: "bg-fill-night",
    muted: "text-foreground/70",
  },
  light: {
    card: "border-border bg-card text-card-foreground",
    media: "bg-fill-cream",
    muted: "text-muted-foreground",
  },
} as const;

/*
 * The whole card is one link: the title link stretches over the card, so
 * the card has a single tab stop whose name is the post title. The card
 * shows the focus ring while its link has keyboard focus.
 */
const cardShell =
  "group/post relative flex flex-col overflow-hidden rounded-lg border transition-[translate,box-shadow] motion-base hover:-translate-y-0.5 hover:shadow-interactive-lift has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-3 has-[a:focus-visible]:outline-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0";
const stretchedLink = "outline-none after:absolute after:inset-0";

function getPostHref(post: BlogPost) {
  const slug = stegaClean(post.slug?.current);
  return slug ? postPath(slug) : null;
}

function PostCardImage({
  className,
  crop,
  dataAttribute,
  fallbackImage,
  post,
  sizes,
  tone,
}: {
  className: string;
  /** Requested pixel size; the frame's aspect ratio decides the final crop. */
  crop: { height: number; width: number };
  dataAttribute?: DataAttribute;
  fallbackImage?: PostImage;
  post: BlogPost;
  sizes: string;
  tone: PostCardTone;
}) {
  const image = post.image?.asset?._id ? post.image : fallbackImage;
  return (
    <figure
      className={cn("relative m-0 overflow-hidden", tones[tone].media, className)}
      data-sanity={post.image?.asset?._id ? dataAttribute?.("image") : undefined}
    >
      {image?.asset?._id ? (
        <Image
          alt={stegaClean(image.alt) || ""}
          blurDataURL={image.asset.metadata?.lqip || undefined}
          className="object-cover saturate-90 transition-[scale,filter] duration-300 group-hover/post:scale-[1.03] group-hover/post:saturate-100 motion-reduce:transition-none"
          fill
          placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
          sizes={sizes}
          src={urlFor(image).width(crop.width).height(crop.height).fit("crop").url()}
          style={
            image.hotspot?.x != null && image.hotspot.y != null
              ? {
                  objectPosition: `${image.hotspot.x * 100}% ${image.hotspot.y * 100}%`,
                }
              : undefined
          }
        />
      ) : null}
    </figure>
  );
}

export function PublicationDate({
  className,
  dataAttribute,
  value,
}: {
  className?: string;
  dataAttribute?: DataAttribute;
  value: string | null;
}) {
  if (!value) return null;
  const label = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  })
    .format(new Date(stegaClean(value)))
    .toUpperCase();
  return (
    <time
      className={className}
      data-sanity={dataAttribute?.("publishedAt")}
      dateTime={stegaClean(value)}
    >
      {label}
    </time>
  );
}

export function documentDataAttribute({
  id,
  stega,
  type,
}: {
  id: string;
  stega: boolean;
  type: "author" | "blogPostSettings" | "category" | "post" | "settings";
}): DataAttribute | undefined {
  if (!stega) return undefined;

  return (path: string) =>
    createDataAttribute({
      baseUrl: process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
      dataset,
      id,
      path,
      projectId,
      type,
    }).toString();
}

type PostCardProps = {
  fallbackImage?: PostImage;
  post: BlogPost;
  stega: boolean;
  tone?: PostCardTone;
};

/** Grid card: cover image, title, three lines of excerpt, date. */
export function PostCard({
  fallbackImage,
  post,
  stega,
  tone = "light",
}: PostCardProps) {
  const href = getPostHref(post);
  if (!href) return null;
  const colors = tones[tone];
  const dataAttribute = documentDataAttribute({ id: post._id, stega, type: "post" });

  return (
    <article className={cn(cardShell, "h-full", colors.card)}>
      <PostCardImage
        className="aspect-[3/2]"
        crop={{ height: 800, width: 1200 }}
        dataAttribute={dataAttribute}
        fallbackImage={fallbackImage}
        post={post}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        tone={tone}
      />
      <div className="flex flex-1 flex-col p-6">
        <h3
          className="text-balance font-display text-title"
          data-sanity={dataAttribute?.("title")}
        >
          <Link className={stretchedLink} href={href}>
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? (
          <p
            className={cn("mt-3 line-clamp-3 text-pretty text-[15px]/relaxed", colors.muted)}
            data-sanity={dataAttribute?.("excerpt")}
          >
            {post.excerpt}
          </p>
        ) : null}
        <div
          className={cn(
            "mt-auto flex items-center justify-between gap-4 pt-6 text-label",
            colors.muted,
          )}
        >
          <PublicationDate
            className="tabular-nums"
            dataAttribute={dataAttribute}
            value={post.publishedAt}
          />
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 group-hover/post:translate-x-1 motion-reduce:transition-none"
          />
        </div>
      </div>
    </article>
  );
}

/** The newest post on page one of the Blog: a wide cover over the story. */
export function FeaturedPostCard({
  fallbackImage,
  post,
  stega,
  tone = "light",
}: PostCardProps) {
  const href = getPostHref(post);
  if (!href) return null;
  const colors = tones[tone];
  const dataAttribute = documentDataAttribute({ id: post._id, stega, type: "post" });

  return (
    <article className={cn(cardShell, colors.card)}>
      <PostCardImage
        className="aspect-[3/2] sm:aspect-[21/9]"
        crop={{ height: 1000, width: 2340 }}
        dataAttribute={dataAttribute}
        fallbackImage={fallbackImage}
        post={post}
        sizes="(min-width: 1400px) 1320px, 100vw"
        tone={tone}
      />
      <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:p-10">
        <div className="max-w-3xl">
          <p className="mb-3 text-eyebrow text-link">Latest post</p>
          <h3
            className="text-balance font-display text-title-lg sm:text-4xl sm:leading-[1.05] sm:tracking-tight"
            data-sanity={dataAttribute?.("title")}
          >
            <Link className={stretchedLink} href={href}>
              {post.title}
            </Link>
          </h3>
          {post.excerpt ? (
            <p
              className={cn("mt-4 line-clamp-4 text-pretty text-base/relaxed lg:text-lg/relaxed", colors.muted)}
              data-sanity={dataAttribute?.("excerpt")}
            >
              {post.excerpt}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-6 text-label lg:flex-col lg:items-end",
            colors.muted,
          )}
        >
          <PublicationDate
            className="tabular-nums"
            dataAttribute={dataAttribute}
            value={post.publishedAt}
          />
          <span
            aria-hidden="true"
            className="inline-flex items-center gap-2 font-semibold text-current"
          >
            Read the post
            <ArrowRight className="size-4 transition-transform duration-200 group-hover/post:translate-x-1 motion-reduce:transition-none" />
          </span>
        </div>
      </div>
    </article>
  );
}

/** Responsive grid of post cards: one, two, then three columns. */
export function PostGrid({
  fallbackImage,
  posts,
  stega,
  tone,
}: {
  fallbackImage?: PostImage;
  posts: BlogPost[];
  stega: boolean;
  tone?: PostCardTone;
}) {
  return (
    <ul className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li className="min-w-0" key={post._id}>
          <PostCard
            fallbackImage={fallbackImage}
            post={post}
            stega={stega}
            tone={tone}
          />
        </li>
      ))}
    </ul>
  );
}
