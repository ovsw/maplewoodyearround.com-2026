import { describe, expect, it, vi } from "vitest";
import {
  buildPostOgImageUrl,
  createPostOgImageRevision,
  fitPostOgTitle,
  getPostOgImageSecret,
  formatPostOgDate,
  isValidPostOgSlug,
  signPostOgImage,
  verifyPostOgImageSignature,
} from "./post-og-image";

const identity = {
  slug: "why-market-trends-are-going-up",
  revision: createPostOgImageRevision({
    title: "Why Market Trends Change",
    publishedAt: "2026-08-15T12:00:00Z",
  }),
};

describe("post OG image URLs", () => {
  it("requires an explicit secret in every environment", () => {
    vi.stubEnv("OG_IMAGE_SECRET", "");

    expect(() => getPostOgImageSecret()).toThrow("OG_IMAGE_SECRET is required");

    vi.unstubAllEnvs();
  });

  it("builds a versioned URL whose signature covers the slug and revision", () => {
    const url = new URL(
      buildPostOgImageUrl({
        ...identity,
        origin: "https://example.com",
        publishedAt: "2026-08-15T12:00:00Z",
        secret: "secret",
        title: "Why Market Trends Change",
      }),
    );

    expect(url.pathname).toBe(`/api/og/post/${identity.slug}`);
    expect(url.searchParams.get("v")).toBe("1");
    expect(url.searchParams.get("rev")).toBe(identity.revision);
    expect(
      verifyPostOgImageSignature({
        identity,
        secret: "secret",
        signature: url.searchParams.get("sig") || "",
      }),
    ).toBe(true);
  });

  it("rejects a signature after any signed value changes", () => {
    const signature = signPostOgImage(identity, "secret");

    expect(
      verifyPostOgImageSignature({
        identity: { ...identity, slug: "another-post" },
        secret: "secret",
        signature,
      }),
    ).toBe(false);
  });

  it.each([
    "",
    "/leading-slash",
    "trailing-slash/",
    "double//slash",
    "../private",
    "space in slug",
  ])("rejects unsafe slug %s", (slug) => {
    expect(isValidPostOgSlug(slug)).toBe(false);
  });
});

describe("post OG image date", () => {
  it("uses the agreed uppercase publication date", () => {
    expect(formatPostOgDate("2026-08-15T23:30:00-07:00")).toBe(
      "AUGUST 16, 2026",
    );
  });

  it("rejects an invalid date", () => {
    expect(formatPostOgDate("not-a-date")).toBeNull();
  });
});

describe("post OG image title", () => {
  it("preserves current titles and bounds unexpected future titles", () => {
    expect(fitPostOgTitle("A normal post title")).toEqual({
      text: "A normal post title",
      fontSize: 54,
    });

    const fitted = fitPostOgTitle("word ".repeat(30));
    expect(fitted.fontSize).toBe(46);
    expect(fitted.text.length).toBeLessThanOrEqual(96);
    expect(fitted.text.endsWith("…")).toBe(true);
  });
});
