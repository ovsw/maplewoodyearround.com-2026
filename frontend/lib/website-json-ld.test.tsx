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

  it("adds the organization facts that are present", () => {
    const [organization] = createWebsiteJsonLd("https://example.com", {
      description: " Day camp since 1965. ",
      email: "",
      logo: "https://cdn.example.com/logo.webp",
      sameAs: ["https://facebook.com/example", null, " "],
      telephone: null,
    })["@graph"];

    expect(organization).toEqual({
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      name: "Example Company",
      url: "https://example.com",
      description: "Day camp since 1965.",
      logo: "https://cdn.example.com/logo.webp",
      sameAs: ["https://facebook.com/example"],
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
