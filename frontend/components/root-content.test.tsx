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

  it.each([
    [
      "the School Year tabbed hero",
      {
        _key: "hero",
        _type: "tabbedHero",
        tabs: [{ _key: "tab", label: "Preschool", title: "Preschool Program" }],
      },
      "Preschool Program",
    ],
    [
      "icon cards with breadcrumbs",
      {
        _key: "programs",
        _type: "iconCards",
        breadcrumbs: [{ _key: "crumb", label: "Home" }],
        cards: [{ _key: "card", title: "Vacation Program" }],
        title: "School Year Programs",
      },
      "School Year Programs",
    ],
  ])("leaves the main heading to %s", (_, block, title) => {
    render(
      <RootContentView
        content={{ ...page, blocks: [block] } as typeof page}
        perspective="published"
        stega={false}
      />,
    );

    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual([title]);
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
    expect(
      screen.getByRole("heading", { level: 1, name: "Post title" }),
    ).toBeInTheDocument();
  });

  it("shows the live post layout: no table of contents, author card after the text", () => {
    const headingRichPost = {
      ...post,
      author: {
        _id: "author-1",
        _type: "author",
        image: null,
        name: "Sharon Maynard",
        role: "Marketing Coordinator",
      },
      body: [
        heading("first", "First"),
        heading("second", "Second"),
        heading("third", "Third"),
      ],
      category: {
        _id: "category-1",
        _type: "category",
        color: "#54e3ff",
        slug: { _type: "slug", current: "school-year" },
        title: "School-Year",
      },
    } as unknown as NonNullable<POST_QUERY_RESULT>;
    render(
      <RootContentView
        content={headingRichPost}
        perspective="published"
        stega={false}
      />,
    );

    expect(screen.queryByRole("navigation", { name: "Table of Contents" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("href", "/news");
    // The category is a label, as on the live site, not a link.
    expect(screen.queryByRole("link", { name: "School-Year" })).not.toBeInTheDocument();
    expect(screen.getByText("School-Year")).toBeInTheDocument();
    expect(screen.getByText("Marketing Coordinator, Maplewood")).toBeInTheDocument();
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
