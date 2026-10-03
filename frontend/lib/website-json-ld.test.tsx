import WebsiteJsonLd from "@/components/website-json-ld";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createWebsiteJsonLd,
  serializeWebsiteJsonLd,
} from "./website-json-ld";

describe("WebsiteJsonLd", () => {
  it("identifies the site with the public brand name", () => {
    expect(createWebsiteJsonLd("https://example.com/")).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://example.com/#organization",
          name: "Example Company",
          url: "https://example.com",
        },
        {
          "@type": "WebSite",
          "@id": "https://example.com/#website",
          name: "Example Company",
          url: "https://example.com",
          publisher: {
            "@id": "https://example.com/#organization",
          },
        },
      ],
    });
  });

  it("escapes less-than signs when serialized", () => {
    const value = createWebsiteJsonLd("https://example.com");
    value["@graph"][0].url = "https://example.com/<unsafe>";

    expect(serializeWebsiteJsonLd(value)).not.toContain("<");
    expect(serializeWebsiteJsonLd(value)).toContain("\\u003cunsafe>");
  });

  it("renders one JSON-LD script", () => {
    const { container } = render(
      <WebsiteJsonLd siteUrl="https://example.com" />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).not.toBeNull();
    expect(JSON.parse(script?.textContent || "{}")).toEqual(
      createWebsiteJsonLd("https://example.com"),
    );
  });
});
