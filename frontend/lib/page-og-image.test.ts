import { describe, expect, it } from "vitest";
import {
  buildPageOgImageUrl,
  createPageOgImageRevision,
  getPageOgImageKey,
  getPageOgImageTitle,
  parsePageOgImageTarget,
  type PageOgImageTarget,
} from "./page-og-image";
import { verifyOgImageSignature } from "./post-og-image";

describe("page OG image URLs", () => {
  it.each<[PageOgImageTarget, string]>([
    [{ kind: "home" }, "/api/og/page/home"],
    [{ kind: "page", slug: "about/jordan" }, "/api/og/page/page/about/jordan"],
    [{ kind: "blog", page: 2 }, "/api/og/page/blog/2"],
    [{ kind: "category", slug: "market-trends", page: 3 }, "/api/og/page/category/market-trends/3"],
  ])("builds a signed, finite URL for %j", (target, pathname) => {
    const title = "Useful guidance";
    const url = new URL(
      buildPageOgImageUrl({
        origin: "https://example.com",
        secret: "secret",
        target,
        title,
      }),
    );

    expect(url.pathname).toBe(pathname);
    expect(
      verifyOgImageSignature({
        identity: {
          key: getPageOgImageKey(target),
          revision: createPageOgImageRevision(title),
          version: url.searchParams.get("v") || "",
        },
        secret: "secret",
        signature: url.searchParams.get("sig") || "",
      }),
    ).toBe(true);
  });

  it("rejects malformed or unbounded targets", () => {
    expect(parsePageOgImageTarget(["unknown", "thing"])).toBeNull();
    expect(parsePageOgImageTarget(["category", "nested", "slug"])).toBeNull();
    expect(parsePageOgImageTarget(["blog", "0"])).toBeNull();
    expect(parsePageOgImageTarget(["blog", "01"])).toBeNull();
    expect(parsePageOgImageTarget(["blog", "1.0"])).toBeNull();
    expect(parsePageOgImageTarget(["blog", "1e0"])).toBeNull();
    expect(parsePageOgImageTarget(["category", "rates", "02"])).toBeNull();
    expect(parsePageOgImageTarget(["page", "../private"])).toBeNull();
    expect(() =>
      buildPageOgImageUrl({
        origin: "https://example.com",
        secret: "secret",
        target: { kind: "page", slug: "../private" },
        title: "Private",
      }),
    ).toThrow("invalid page target");
    expect(() =>
      buildPageOgImageUrl({
        origin: "https://example.com",
        secret: "secret",
        target: { kind: "category", slug: "nested/slug" },
        title: "Nested",
      }),
    ).toThrow("invalid page target");
  });

  it("removes a redundant brand suffix from the card title", () => {
    expect(
      getPageOgImageTitle(
        "Example services | Maplewood",
      ),
    ).toBe("Example services");
    expect(getPageOgImageTitle("Service Planning")).toBe(
      "Service Planning",
    );
  });
});
