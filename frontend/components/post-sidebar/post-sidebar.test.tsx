import type { PortableTextProps } from "@portabletext/react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RichTextContent from "@/components/rich-text-content";
import {
  createPostBodyModel,
  type BlogPostSidebar,
} from "./model";
import { PostSidebar, PostTableOfContentsRail } from "./post-sidebar";

function heading(key: string, style: string, text: string) {
  return {
    _key: key,
    _type: "block",
    children: [{ _key: `${key}-span`, _type: "span", marks: [], text }],
    markDefs: [],
    style,
  };
}

const threeHeadings = [
  heading("first", "h2", "First section"),
  heading("child", "h3", "Child section"),
  heading("second", "h2", "Second section"),
] as PortableTextProps["value"];

const currentSidebar = {
  _id: "blogPostSettings",
  _type: "blogPostSettings",
  title: "Explore the topic",
  description: "Choose the next resource that fits what you want to learn.",
  actions: [
    {
      _key: "guide",
      title: "Read the guide",
      description: "Start with the complete guide for this topic.",
      text: "Open guide",
      openInNewTab: false,
      href: "/guide/",
    },
    {
      _key: "external-resource",
      title: "External resource",
      description: "Open a related resource in a new tab.",
      text: "Open resource",
      openInNewTab: true,
      href: "https://example.com/resource/",
    },
    {
      _key: "checklist",
      title: "Checklist",
      description: "Review the checklist before you continue.",
      text: "View checklist",
      openInNewTab: false,
      href: "/checklist/",
    },
    {
      _key: "contact",
      title: "Contact",
      description: "Send a question about this topic.",
      text: "Email us",
      openInNewTab: false,
      href: "mailto:hello@example.com",
    },
  ],
} satisfies BlogPostSidebar;

describe("PostSidebar", () => {
  it("renders all four CMS actions in document order", () => {
    render(<PostSidebar sidebar={currentSidebar} />);

    const sidebar = screen.getByRole("complementary", {
      name: "Post actions",
    });
    expect(within(sidebar).getByRole("heading", { name: "Explore the topic" })).toBeInTheDocument();
    expect(
      within(sidebar).getAllByRole("heading", { level: 3 }).map((item) => item.textContent),
    ).toEqual([
      "Read the guide",
      "External resource",
      "Checklist",
      "Contact",
    ]);
  });

  it("points click-to-edit at Blog Post Settings fields", () => {
    const dataAttribute = vi.fn((path: string) => `source:${path}`);
    render(<PostSidebar dataAttribute={dataAttribute} sidebar={currentSidebar} />);

    expect(screen.getByRole("complementary", { name: "Post actions" })).toHaveAttribute(
      "data-sanity",
      "source:actions",
    );
    expect(screen.getByRole("heading", { name: "Explore the topic" })).toHaveAttribute(
      "data-sanity",
      "source:title",
    );
    expect(dataAttribute).not.toHaveBeenCalledWith(expect.stringContaining("blogPostSidebar."));
  });

  it("renders exactly two CMS actions in document order", () => {
    render(
      <PostSidebar
        sidebar={{ ...currentSidebar, actions: currentSidebar.actions.slice(0, 2) }}
      />,
    );

    expect(screen.getAllByRole("heading", { level: 3 }).map((item) => item.textContent)).toEqual([
      "Read the guide",
      "External resource",
    ]);
  });

  it("places action descriptions before their links", () => {
    render(<PostSidebar sidebar={currentSidebar} />);

    const description = screen.getByText("Open a related resource in a new tab.");
    const link = screen.getByRole("link", { name: "Open resource" });
    expect(description.compareDocumentPosition(link)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it.each([
    ["missing", null],
    ["empty", { ...currentSidebar, actions: [] }],
  ])("renders nothing for a %s sidebar", (_label, sidebar) => {
    const { container } = render(
      <PostSidebar sidebar={sidebar as BlogPostSidebar | null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("uses the correct link element and target behavior for internal, external, and tel destinations", () => {
    render(<PostSidebar sidebar={currentSidebar} />);

    const email = screen.getByRole("link", { name: "Email us" });
    expect(email).toHaveAttribute("href", "mailto:hello@example.com");
    expect(email).not.toHaveAttribute("target");

    const external = screen.getByRole("link", { name: "Open resource" });
    expect(external).toHaveAttribute("href", "https://example.com/resource/");
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");

    const internalCard = screen
      .getByRole("heading", { name: "Checklist" })
      .closest("section");
    const internal = within(internalCard as HTMLElement).getByRole("link", {
      name: "View checklist",
    });
    expect(internal).toHaveAttribute("href", "/checklist");
    expect(internal).not.toHaveAttribute("target");
  });

  it("shows a native open table of contents for three headings", () => {
    const bodyModel = createPostBodyModel(threeHeadings);
    render(<PostTableOfContentsRail headings={bodyModel.headings} />);

    expect(screen.getByText("Table of contents").closest("details")).toHaveAttribute("open");
    expect(screen.getByRole("navigation", { name: "Table of Contents" })).toBeInTheDocument();
  });

  it("renders hierarchical anchors that match the scoped post heading IDs", () => {
    const bodyModel = createPostBodyModel(threeHeadings);
    render(
      <>
        <RichTextContent getHeadingId={bodyModel.getHeadingId} value={threeHeadings} />
        <PostTableOfContentsRail headings={bodyModel.headings} />
      </>,
    );

    const firstLink = screen.getByRole("link", { name: "First section" });
    const childLink = screen.getByRole("link", { name: "Child section" });
    expect(firstLink).toHaveAttribute("href", "#first-section");
    expect(childLink).toHaveAttribute("href", "#child-section");
    expect(document.querySelector("h2#first-section")).toBeInTheDocument();
    expect(document.querySelector("h3#child-section")).toBeInTheDocument();
    expect(firstLink.closest("li")).toContainElement(childLink);
  });

  it("matches an ID for a valid heading even when its Portable Text key is absent", () => {
    const unkeyedHeading = heading("temporary", "h2", "Unkeyed heading");
    delete (unkeyedHeading as { _key?: string })._key;
    const body = [
      unkeyedHeading,
      heading("second", "h2", "Second heading"),
      heading("third", "h2", "Third heading"),
    ];
    const bodyModel = createPostBodyModel(body as PortableTextProps["value"]);

    render(
      <>
        <RichTextContent getHeadingId={bodyModel.getHeadingId} value={body} />
        <PostTableOfContentsRail headings={bodyModel.headings} />
      </>,
    );

    expect(screen.getByRole("link", { name: "Unkeyed heading" })).toHaveAttribute(
      "href",
      "#unkeyed-heading",
    );
    expect(document.querySelector("h2#unkeyed-heading")).toBeInTheDocument();
  });
});
