import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PAGE_QUERY_RESULT, POST_QUERY_RESULT } from "@/sanity.types";
import type { BlogPostSidebar } from "@/components/post-sidebar/model";
import { RootContentView } from "./root-content";

const page = {
  _id: "page-1",
  _type: "page",
  blocks: [],
  description: null,
  slug: "ordinary-page",
  title: "Ordinary page",
} as unknown as NonNullable<PAGE_QUERY_RESULT>;

const post = {
  _createdAt: "2026-08-02T00:00:00.000Z",
  _id: "post-1",
  _type: "post",
  _updatedAt: "2026-08-03T00:00:00.000Z",
  body: [],
  excerpt: "Post introduction",
  publishedAt: "2026-08-02T00:00:00.000Z",
  slug: { _type: "slug", current: "post-title" },
  title: "Post title",
} as unknown as NonNullable<POST_QUERY_RESULT>;

const blogPostSidebar = {
  _id: "blogPostSettings",
  _type: "blogPostSettings",
  title: "Explore the topic",
  description: null,
  actions: [
    {
      _key: "guide",
      title: "Read the guide",
      description: null,
      text: "Open guide",
      openInNewTab: true,
      href: "https://example.com/guide/",
    },
  ],
} satisfies BlogPostSidebar;

function heading(key: string, text: string) {
  return {
    _key: key,
    _type: "block",
    children: [{ _key: `${key}-span`, _type: "span", marks: [], text }],
    markDefs: [],
    style: "h2",
  };
}

function isJsonLdType(value: unknown, type: string) {
  return (
    typeof value === "object" &&
    value !== null &&
    "@type" in value &&
    value["@type"] === type
  );
}

function jsonLdNodesByType(container: HTMLElement, type: string) {
  const nodes: unknown[] = [];

  for (const script of container.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    const value: unknown = JSON.parse(script.textContent ?? "null");
    if (isJsonLdType(value, type)) nodes.push(value);
  }

  return nodes;
}

describe("RootContentView", () => {
  it("renders the page title when no Hero provides the main heading", () => {
    render(
      <RootContentView content={page} perspective="published" stega={false} />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Ordinary page" }),
    ).toBeInTheDocument();
  });

  it("gates the post sidebar to post root content", () => {
    const { rerender } = render(
      <RootContentView content={page} perspective="published" stega={false} />,
    );
    expect(screen.queryByRole("complementary", { name: "Post actions" })).not.toBeInTheDocument();

    rerender(
      <RootContentView
        blogPostSidebar={blogPostSidebar}
        content={post}
        perspective="published"
        stega={false}
      />,
    );
    expect(
      screen.getByRole("complementary", { name: "Post actions" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Post introduction")).toBeInTheDocument();
  });

  it("omits the table of contents for a thin post and keeps the CTA after the article", () => {
    const thinPost = {
      ...post,
      body: [heading("first", "First"), heading("second", "Second")],
    } as unknown as NonNullable<POST_QUERY_RESULT>;
    const { container } = render(
      <RootContentView
        blogPostSidebar={blogPostSidebar}
        content={thinPost}
        perspective="published"
        stega={false}
      />,
    );

    const layout = container.querySelector('[data-post-layout="two-column"]');
    expect(screen.queryByRole("navigation", { name: "Table of Contents" })).not.toBeInTheDocument();
    expect(layout?.querySelector("article")?.nextElementSibling).toHaveAttribute(
      "aria-label",
      "Post actions",
    );
  });

  it("shows the table of contents for a heading-rich post", () => {
    const headingRichPost = {
      ...post,
      body: [
        heading("first", "First"),
        heading("second", "Second"),
        heading("third", "Third"),
      ],
    } as unknown as NonNullable<POST_QUERY_RESULT>;
    render(
      <RootContentView
        blogPostSidebar={blogPostSidebar}
        content={headingRichPost}
        perspective="published"
        stega={false}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Table of Contents" })).toBeInTheDocument();
  });

  it("emits exactly one BlogPosting script for posts and none for pages", () => {
    const { container, rerender } = render(
      <RootContentView content={post} perspective="published" stega={false} />,
    );
    expect(jsonLdNodesByType(container, "BlogPosting")).toHaveLength(1);

    rerender(
      <RootContentView content={page} perspective="published" stega={false} />,
    );
    expect(jsonLdNodesByType(container, "BlogPosting")).toHaveLength(0);
  });

  it("emits breadcrumb structured data for posts and pages", () => {
    const { container, rerender } = render(
      <RootContentView content={page} perspective="published" stega={false} />,
    );
    expect(jsonLdNodesByType(container, "BreadcrumbList")).toHaveLength(1);

    rerender(
      <RootContentView content={post} perspective="published" stega={false} />,
    );
    expect(jsonLdNodesByType(container, "BreadcrumbList")).toHaveLength(1);
  });

  it("emits VideoObject structured data when the content contains video blocks", () => {
    const videoPost = {
      ...post,
      body: [
        {
          _key: "video-1",
          _type: "videoEmbed",
          title: "Product walkthrough",
          url: "https://video.example.com/embed/1",
        },
      ],
    } as unknown as NonNullable<POST_QUERY_RESULT>;
    const { container } = render(
      <RootContentView content={videoPost} perspective="published" stega={false} />,
    );

    expect(jsonLdNodesByType(container, "VideoObject")).toHaveLength(1);
  });

  it("does not emit donor service structured data for pages or posts", () => {
    const { container, rerender } = render(
      <RootContentView content={page} perspective="published" stega={false} />,
    );
    expect(jsonLdNodesByType(container, "FinancialProduct")).toHaveLength(0);

    rerender(
      <RootContentView content={post} perspective="published" stega={false} />,
    );
    expect(jsonLdNodesByType(container, "FinancialProduct")).toHaveLength(0);
  });
});
