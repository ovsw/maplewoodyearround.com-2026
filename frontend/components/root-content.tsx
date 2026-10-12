import { createDataAttribute, stegaClean } from "next-sanity";
import Blocks from "@/components/blocks";
import BlogPostingJsonLd from "@/components/blog-posting-json-ld";
import BreadcrumbJsonLd from "@/components/breadcrumb-json-ld";
import FaqPageJsonLd from "@/components/faq-json-ld";
import { siteUrl } from "@/lib/site-url";
import VideoJsonLd from "@/components/video-json-ld";
import PostHero from "@/components/blocks/post-hero";
import { postPath } from "@/lib/routes";
import {
  createPostBodyModel,
  getPostReadTime,
  type BlogPostSidebar,
} from "@/components/post-sidebar/model";
import { PostSidebar } from "@/components/post-sidebar/post-sidebar";
import newsCss from "@/components/news/news.module.css";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import { documentDataAttribute } from "@/components/blog-card";
import RichTextContent from "@/components/rich-text-content";
import { dataset, projectId } from "@/sanity/lib/env";
import type { DynamicFetchOptions } from "@/sanity/lib/live";
import type { PAGE_QUERY_RESULT, POST_QUERY_RESULT } from "@/sanity.types";

function PageContent({
  page,
  perspective,
  stega,
}: {
  page: NonNullable<PAGE_QUERY_RESULT>;
  perspective: DynamicFetchOptions["perspective"];
  stega: boolean;
}) {
  const blocks = page.blocks ?? [];
  const needsTitleHeader =
    blocks[0]?._type !== "hero" &&
    blocks[0]?._type !== "innerHero" &&
    // Program cards with breadcrumbs are the page header, as on /summer-camp/programs.
    !(blocks[0]?._type === "programCards" && blocks[0].breadcrumbs?.length) &&
    // The director story and the calendar section carry their page's heading.
    blocks[0]?._type !== "directorIntro" &&
    !(blocks[0]?._type === "embedSection" && stegaClean(blocks[0].provider) === "Events Calendar") &&
    stegaClean(page.title)?.trim();
  const rootDataAttribute = stega
    ? (path: "description" | "title") =>
        createDataAttribute({
          baseUrl: process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
          dataset,
          id: page._id,
          path,
          projectId,
          type: "page",
        }).toString()
    : undefined;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: page.title || "Page", path: `/${page.slug}` },
        ]}
        siteUrl={siteUrl}
      />
      <FaqPageJsonLd blocks={blocks} />
      <VideoJsonLd content={blocks} />
      {needsTitleHeader ? (
        <header>
          <h1 data-sanity={rootDataAttribute?.("title")}>{page.title}</h1>
          {stegaClean(page.description)?.trim() ? (
            <p data-sanity={rootDataAttribute?.("description")}>
              {page.description}
            </p>
          ) : null}
        </header>
      ) : null}
      <Blocks
        blocks={blocks}
        documentId={page._id}
        perspective={perspective}
        stega={stega}
      />
    </>
  );
}

function PostContent({
  blogPostSidebar,
  post,
  stega,
}: {
  blogPostSidebar: BlogPostSidebar | null;
  post: NonNullable<POST_QUERY_RESULT>;
  stega: boolean;
}) {
  const body = post.body ?? [];
  const bodyModel = createPostBodyModel(body);
  const readTime = getPostReadTime(body);
  const postSlug = post.slug?.current?.replace(/^\/+|\/+$/g, "") || "";
  const postCanonicalPath = postPath(postSlug) || "/news";
  const author = post.author;
  const authorRole = stegaClean(author?.role)?.trim();
  const authorDataAttribute = author
    ? documentDataAttribute({ id: author._id, stega, type: "author" })
    : undefined;
  const blogPostSettingsDataAttribute = blogPostSidebar
    ? documentDataAttribute({
        id: blogPostSidebar._id,
        stega,
        type: blogPostSidebar._type,
      })
    : undefined;
  const bodyDataAttribute = stega
    ? createDataAttribute({
        baseUrl: process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
        dataset,
        id: post._id,
        path: "body",
        projectId,
        type: "post",
      }).toString()
    : undefined;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "News", path: "/news" },
          { name: post.title || "Post", path: postCanonicalPath },
        ]}
        siteUrl={siteUrl}
      />
      <BlogPostingJsonLd post={post} siteUrl={siteUrl} />
      <VideoJsonLd content={body} />
      <PostHero post={post} readTime={readTime} stega={stega} />
      <article className={newsCss.postBody}>
        <div className={newsCss.postBodyInner}>
          {body.length ? (
            <RichTextContent
              className={newsCss.richText}
              dataSanity={bodyDataAttribute}
              getHeadingId={bodyModel.getHeadingId}
              value={body}
            />
          ) : null}
          {author?.name ? (
            <>
              <hr className={newsCss.divider} />
              <div className={newsCss.postAuthor}>
                {author.image?.asset?._id ? (
                  <Image
                    alt=""
                    data-sanity={authorDataAttribute?.("image")}
                    height={56}
                    sizes="56px"
                    src={urlFor(author.image).width(112).height(112).url()}
                    width={56}
                  />
                ) : null}
                <div>
                  <p
                    className={newsCss.postAuthorName}
                    data-sanity={authorDataAttribute?.("name")}
                  >
                    {author.name}
                  </p>
                  {authorRole ? (
                    <p data-sanity={authorDataAttribute?.("role")}>
                      {author.role}, Maplewood
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
          <PostSidebar
            dataAttribute={blogPostSettingsDataAttribute}
            sidebar={blogPostSidebar}
          />
        </div>
      </article>
    </>
  );
}

export function RootContentView({
  blogPostSidebar = null,
  content,
  perspective,
  stega,
}: {
  blogPostSidebar?: BlogPostSidebar | null;
  content: NonNullable<PAGE_QUERY_RESULT | POST_QUERY_RESULT>;
  perspective: DynamicFetchOptions["perspective"];
  stega: boolean;
}) {
  return content._type === "post" ? (
    <PostContent blogPostSidebar={blogPostSidebar} post={content} stega={stega} />
  ) : (
    <PageContent page={content} perspective={perspective} stega={stega} />
  );
}
