import { PostOgImage, type CardBreadcrumb } from "@/components/post-og-image";
import { sharingImageUrl } from "@/sanity/lib/image";
import { fetchSeoSettings } from "@/sanity/lib/seo-settings";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const poppinsBold = readFile(
  join(
    process.cwd(),
    "node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff",
  ),
);
const latoRegular = readFile(
  join(
    process.cwd(),
    "node_modules/@fontsource/lato/files/lato-latin-400-normal.woff",
  ),
);

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
  "CDN-Cache-Control": "public, max-age=31536000, immutable",
  "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
  "Content-Security-Policy": "default-src 'none'",
  "X-Content-Type-Options": "nosniff",
};

export async function createOgImageResponse({
  breadcrumbs,
  eyebrow,
  photoUrl,
  title,
}: {
  breadcrumbs?: CardBreadcrumb[];
  eyebrow?: string;
  photoUrl?: string | null;
  title: string;
}) {
  const [poppins, lato] = await Promise.all([poppinsBold, latoRegular]);

  return new ImageResponse(
    <PostOgImage
      breadcrumbs={breadcrumbs}
      eyebrow={eyebrow}
      photoUrl={photoUrl}
      title={title}
    />,
    {
      width: 1200,
      height: 630,
      headers: CACHE_HEADERS,
      fonts: [
        { name: "Poppins", data: poppins, style: "normal", weight: 700 },
        { name: "Lato", data: lato, style: "normal", weight: 400 },
      ],
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
