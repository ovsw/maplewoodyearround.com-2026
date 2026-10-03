import { buildPostOgImageUrl } from "@/lib/post-og-image";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeState = vi.hoisted(() => ({ renderFails: false }));
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
    _element: unknown,
    options: { headers?: HeadersInit },
  ) {
    if (routeState.renderFails) throw new Error("render failed");
    return new Response("png", { headers: options.headers, status: 200 });
  },
}));

import { GET } from "./route";

const title = "Why Market Trends Change";
const publishedAt = "2026-08-15T12:00:00Z";
const slug = "market-trends";

function signedUrl() {
  return buildPostOgImageUrl({
    origin: "https://example.test",
    publishedAt,
    secret: "test-only-og-image-secret",
    slug,
    title,
  });
}

function get(url: string) {
  return GET(new Request(url), { params: Promise.resolve({ slug: [slug] }) });
}

describe("post OG image route", () => {
  beforeEach(() => {
    routeState.renderFails = false;
    sanityFetchMetadata.mockReset();
    sanityFetchMetadata.mockResolvedValue({
      data: { title, publishedAt },
    });
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
    expect(response.headers.get("cdn-cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(response.headers.get("vercel-cdn-cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("rejects a signed URL after visible card content changes", async () => {
    sanityFetchMetadata.mockResolvedValue({
      data: { title: "A changed title", publishedAt },
    });

    expect((await get(signedUrl())).status).toBe(404);
  });

  it("returns 404 for a missing or unpublished post", async () => {
    sanityFetchMetadata.mockResolvedValue({ data: null });

    expect((await get(signedUrl())).status).toBe(404);
  });

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
