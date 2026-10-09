import { buildPageOgImageUrl, getPageOgImagePath, type PageOgImageTarget } from "@/lib/page-og-image";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeState = vi.hoisted(() => ({
  cardProps: null as Record<string, unknown> | null,
  renderFails: false,
}));
const sanityFetchMetadata = vi.hoisted(() => vi.fn());

vi.mock("@/sanity/lib/live", () => ({ sanityFetchMetadata }));
vi.mock("node:fs/promises", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:fs/promises")>()),
  readFile: vi.fn(async () => Buffer.from("asset")),
}));
vi.mock("@/components/post-og-image", () => ({
  PostOgImage: vi.fn(() => null),
}));
vi.mock("next/og", () => ({
  ImageResponse: function MockImageResponse(
    element: { props: Record<string, unknown> },
    options: { headers?: HeadersInit },
  ) {
    if (routeState.renderFails) throw new Error("render failed");
    routeState.cardProps = element.props;
    return new Response("png", { headers: options.headers, status: 200 });
  },
}));

import { GET } from "./route";

const title = "Straightforward Guidance";

function signedUrl() {
  return buildPageOgImageUrl({
    origin: "https://example.test",
    secret: "test-only-og-image-secret",
    target: { kind: "home" },
    title,
  });
}

function get(url: string) {
  return GET(new Request(url), { params: Promise.resolve({ path: ["home"] }) });
}

describe("page OG image route", () => {
  beforeEach(() => {
    routeState.renderFails = false;
    routeState.cardProps = null;
    sanityFetchMetadata.mockReset();
    sanityFetchMetadata.mockResolvedValue({ data: { title } });
  });

  it("rejects bad signatures and extra inputs before fetching Sanity", async () => {
    const badSignature = new URL(signedUrl());
    badSignature.searchParams.set("sig", "invalid");
    const extraInput = new URL(signedUrl());
    extraInput.searchParams.set("title", "attacker controlled");

    expect((await get(badSignature.toString())).status).toBe(404);
    expect((await get(extraInput.toString())).status).toBe(404);
    expect(sanityFetchMetadata).not.toHaveBeenCalled();
  });

  it("fetches published content and returns immutable browser and CDN caching", async () => {
    const response = await get(signedUrl());

    expect(response.status).toBe(200);
    expect(sanityFetchMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ perspective: "published" }),
    );
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(response.headers.get("vercel-cdn-cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("keeps the SEO override out of the visible card headline", async () => {
    sanityFetchMetadata.mockResolvedValueOnce({
      data: {
        overrideTitle: "Home | The Highly Motivated Vercellino Team",
        title,
      },
    });

    expect((await get(signedUrl())).status).toBe(200);
  });

  it("draws the signed hero photo and rejects a replaced one", async () => {
    const photo = {
      asset: { _ref: "image-abc123-1000x1000-jpg" },
      crop: null,
      hotspot: { x: 0.5, y: 0.4, width: 0.6, height: 0.6 },
    };
    const url = buildPageOgImageUrl({
      origin: "https://example.test",
      photo,
      secret: "test-only-og-image-secret",
      target: { kind: "home" },
      title,
    });

    sanityFetchMetadata.mockResolvedValueOnce({ data: { title, sharingPhoto: photo } });
    expect((await get(url)).status).toBe(200);
    expect(routeState.cardProps?.photoUrl).toContain("abc123-1000x1000.jpg");
    expect(routeState.cardProps?.photoUrl).toContain("w=600&h=630");

    sanityFetchMetadata.mockResolvedValueOnce({
      data: { title, sharingPhoto: { ...photo, hotspot: { ...photo.hotspot, x: 0.2 } } },
    });
    expect((await get(url)).status).toBe(404);

    sanityFetchMetadata.mockResolvedValueOnce({ data: { title } });
    expect((await get(url)).status).toBe(404);
  });

  it("draws the card without a photo when the page has no hero photo", async () => {
    expect((await get(signedUrl())).status).toBe(200);
    expect(routeState.cardProps?.photoUrl).toBeNull();
  });

  it("rejects stale, missing, or unpublished page content", async () => {
    sanityFetchMetadata.mockResolvedValueOnce({ data: { title: "Changed" } });
    expect((await get(signedUrl())).status).toBe(404);

    sanityFetchMetadata.mockResolvedValueOnce({ data: null });
    expect((await get(signedUrl())).status).toBe(404);
  });

  it.each([
    { target: { kind: "blog" }, data: {}, title: "Blog" },
    { target: { kind: "blog", page: 2 }, data: { title: "", overrideTitle: "" }, title: "Blog - Page 2" },
    { target: { kind: "category", slug: "camp" }, data: {}, title: "Blog category" },
    { target: { kind: "category", slug: "camp", page: 2 }, data: { overrideTitle: "Camp news" }, title: "Camp news - Page 2" },
    { target: { kind: "blog" }, data: { title: "Camp news", overrideTitle: "SEO title" }, title: "Camp news" },
    { target: { kind: "page", slug: "about" }, data: { title: "", overrideTitle: "About camp" }, title: "About camp" },
  ] satisfies Array<{ target: PageOgImageTarget; data: { title?: string; overrideTitle?: string }; title: string }>) (
    "renders the signed fallback title for $target.kind: $title",
    async ({ target, data, title }) => {
      sanityFetchMetadata.mockResolvedValueOnce({ data });
      const url = buildPageOgImageUrl({ origin: "https://example.test", target, title });
      const response = await GET(new Request(url), {
        params: Promise.resolve({ path: getPageOgImagePath(target).split("/") }),
      });
      expect(response.status).toBe(200);
    },
  );

  it.each([
    { target: { kind: "blog" }, data: null },
    { target: { kind: "page", slug: "about" }, data: {} },
  ] satisfies Array<{ target: PageOgImageTarget; data: Record<string, never> | null }>) (
    "keeps missing content or title without a fallback as not found",
    async ({ target, data }) => {
      sanityFetchMetadata.mockResolvedValueOnce({ data });
      const url = buildPageOgImageUrl({ origin: "https://example.test", target, title: "Blog" });
      expect((await GET(new Request(url), {
        params: Promise.resolve({ path: getPageOgImagePath(target).split("/") }),
      })).status).toBe(404);
    },
  );

  it("redirects render failures to the prebuilt local fallback", async () => {
    routeState.renderFails = true;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await get(signedUrl());

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://example.test/images/og-placeholder.svg",
    );
    consoleError.mockRestore();
  });

  it("redirects render failures to the Site sharing image when one is set", async () => {
    routeState.renderFails = true;
    sanityFetchMetadata.mockResolvedValueOnce({ data: { title } });
    sanityFetchMetadata.mockResolvedValueOnce({
      data: {
        seoImage: {
          asset: { _id: "image-site1234-2400x1600-jpg", mimeType: "image/jpeg" },
        },
      },
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await get(signedUrl());
    const location = new URL(response.headers.get("location") || "");

    expect(response.status).toBe(302);
    expect(location.origin + location.pathname).toBe(
      "https://cdn.sanity.io/images/test-project/test/site1234-2400x1600.jpg",
    );
    expect(location.searchParams.get("w")).toBe("1200");
    expect(location.searchParams.get("h")).toBe("630");
    expect(sanityFetchMetadata).toHaveBeenLastCalledWith(
      expect.objectContaining({ perspective: "published" }),
    );
    consoleError.mockRestore();
  });

  it("redirects Sanity fetch failures to the prebuilt local fallback", async () => {
    sanityFetchMetadata.mockRejectedValueOnce(new Error("Sanity unavailable"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await get(signedUrl());

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://example.test/images/og-placeholder.svg",
    );
    consoleError.mockRestore();
  });
});
