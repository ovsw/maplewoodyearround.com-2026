import BreadcrumbJsonLd from "@/components/breadcrumb-json-ld";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createBreadcrumbJsonLd,
  serializeBreadcrumbJsonLd,
} from "./breadcrumb-json-ld";

describe("BreadcrumbJsonLd", () => {
  it("builds canonical breadcrumb items without ending slashes", () => {
    expect(
      createBreadcrumbJsonLd(
        [
          { name: " Home ", path: "/" },
          { name: " Blog ", path: "/blog/" },
          { name: " Article ", path: "blog/article/" },
        ],
        "https://example.com/",
      ),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://example.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: "https://example.com/blog",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Article",
          item: "https://example.com/blog/article",
        },
      ],
    });
  });

  it("returns null when the trail is too short", () => {
    expect(
      createBreadcrumbJsonLd([{ name: "Home", path: "/" }], "https://example.com"),
    ).toBeNull();
  });

  it("escapes unsafe text and renders one script", () => {
    const value = createBreadcrumbJsonLd(
      [
        { name: "Home", path: "/" },
        { name: "Unsafe <page>", path: "/unsafe" },
      ],
      "https://example.com",
    );
    expect(value).not.toBeNull();
    if (!value) return;

    expect(serializeBreadcrumbJsonLd(value)).not.toContain("<");

    const { container } = render(
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Unsafe <page>", path: "/unsafe" },
        ]}
        siteUrl="https://example.com"
      />,
    );

    expect(
      JSON.parse(
        container.querySelector('script[type="application/ld+json"]')
          ?.textContent || "{}",
      ),
    ).toEqual(value);
  });
});
