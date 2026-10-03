import {
  createOgImageResponse,
  ogImageFallbackResponse,
} from "@/lib/og-image-response";
import {
  POST_OG_IMAGE_VERSION,
  createPostOgImageRevision,
  formatPostOgDate,
  getPostOgImageSecret,
  isValidPostOgSlug,
  verifyPostOgImageSignature,
} from "@/lib/post-og-image";
import { sanityFetchMetadata } from "@/sanity/lib/live";
import { POST_OG_IMAGE_QUERY } from "@/sanity/queries/post";
import type { POST_OG_IMAGE_QUERY_RESULT } from "@/sanity.types";

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: {
      "Cache-Control": "public, max-age=60",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function hasExactQueryShape(searchParams: URLSearchParams) {
  const keys = [...searchParams.keys()];
  return (
    keys.length === 3 &&
    searchParams.getAll("v").length === 1 &&
    searchParams.getAll("rev").length === 1 &&
    searchParams.getAll("sig").length === 1
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug: slugSegments } = await params;
  const slug = slugSegments.join("/");
  const { searchParams } = new URL(request.url);

  if (!isValidPostOgSlug(slug) || !hasExactQueryShape(searchParams)) {
    return notFound();
  }

  const version = searchParams.get("v") || "";
  const revision = searchParams.get("rev") || "";
  const signature = searchParams.get("sig") || "";
  if (
    version !== POST_OG_IMAGE_VERSION ||
    !/^[A-Za-z0-9_-]{22}$/.test(revision) ||
    !verifyPostOgImageSignature({
      identity: { slug, revision, version },
      secret: getPostOgImageSecret(),
      signature,
    })
  ) {
    return notFound();
  }

  try {
    const { data: post } = (await sanityFetchMetadata({
      query: POST_OG_IMAGE_QUERY,
      params: { slug },
      perspective: "published",
    })) as { data: POST_OG_IMAGE_QUERY_RESULT };

    const title = post?.title?.trim();
    const date = post?.publishedAt && formatPostOgDate(post.publishedAt);
    if (
      !title ||
      !post?.publishedAt ||
      !date ||
      createPostOgImageRevision({ publishedAt: post.publishedAt, title }) !==
        revision
    ) {
      return notFound();
    }

    return await createOgImageResponse({ eyebrow: date, title });
  } catch (error) {
    return await ogImageFallbackResponse(error, "Post");
  }
}
