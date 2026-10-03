import { PostOgImage } from "@/components/post-og-image";
import { siteName } from "@/lib/site-name";
import { sharingImageUrl } from "@/sanity/lib/image";
import { fetchSeoSettings } from "@/sanity/lib/seo-settings";
import { ImageResponse } from "next/og";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
  "CDN-Cache-Control": "public, max-age=31536000, immutable",
  "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
  "Content-Security-Policy": "default-src 'none'",
  "X-Content-Type-Options": "nosniff",
};

export async function createOgImageResponse({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {

  return new ImageResponse(
    <PostOgImage eyebrow={eyebrow} siteName={siteName} title={title} />,
    {
      width: 1200,
      height: 630,
      headers: CACHE_HEADERS,
    },
  );
}

function staticSafetyImageUrl() {
  return new URL(
    "/images/og-placeholder.svg",
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ).toString();
}

// The generator failed, so fall back to the Site sharing image, then the static
// safety image. Both targets live outside this route, so a redirect cannot loop.
async function fallbackImageUrl() {
  try {
    const image = (await fetchSeoSettings())?.seoImage;
    if (image?.asset?._id) return sharingImageUrl(image);
  } catch (error) {
    console.error("Site sharing image lookup failed", error);
  }
  return staticSafetyImageUrl();
}

export async function ogImageFallbackResponse(
  error: unknown,
  context: "Page" | "Post",
) {
  console.error(`${context} OG image generation failed`, error);
  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "public, max-age=300",
      Location: await fallbackImageUrl(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
