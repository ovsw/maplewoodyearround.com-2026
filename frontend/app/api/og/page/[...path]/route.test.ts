import { buildPageOgImageUrl } from "@/lib/page-og-image";
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

  it("rejects stale, missing, or unpublished page content", async () => {
    sanityFetchMetadata.mockResolvedValueOnce({ data: { title: "Changed" } });
    expect((await get(signedUrl())).status).toBe(404);

    sanityFetchMetadata.mockResolvedValueOnce({ data: null });
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
