import { getBlogPageTitle } from "@/lib/blog-index";
import { siteName } from "@/lib/site-name";
import {
  createOgImageResponse,
  ogImageFallbackResponse,
} from "@/lib/og-image-response";
import {
  createPageOgImageRevision,
  getPageOgImageKey,
  getPageOgImageTitle,
  parsePageOgImageTarget,
} from "@/lib/page-og-image";
import {
  OG_IMAGE_VERSION,
  getOgImageSecret,
  verifyOgImageSignature,
} from "@/lib/post-og-image";
import { sanityFetchMetadata } from "@/sanity/lib/live";
import {
  BLOG_INDEX_OG_IMAGE_QUERY,
  CATEGORY_OG_IMAGE_QUERY,
  HOME_PAGE_OG_IMAGE_QUERY,
  PAGE_OG_IMAGE_QUERY,
} from "@/sanity/queries/og-image";
import { resolveSeoTitle } from "../../../../../../shared/seo-title";

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

async function fetchTitle(
  target: NonNullable<ReturnType<typeof parsePageOgImageTarget>>,
) {
  if (target.kind === "home") {
    const { data } = (await sanityFetchMetadata({
      query: HOME_PAGE_OG_IMAGE_QUERY,
      perspective: "published",
    })) as { data: { overrideTitle?: string | null; title?: string | null } | null };
    if (!data) return null;

    // The card headline follows the visible content title. The SEO override
    // stays in metadata and image alt text.
    return getPageOgImageTitle(
      data.title ||
        resolveSeoTitle({
          overrideTitle: data.overrideTitle,
          siteName,
        }).pageTitle,
    );
  }

  const query =
    target.kind === "blog"
      ? BLOG_INDEX_OG_IMAGE_QUERY
      : target.kind === "category"
        ? CATEGORY_OG_IMAGE_QUERY
        : PAGE_OG_IMAGE_QUERY;
  const params = "slug" in target ? { slug: target.slug } : undefined;
  const { data } = (await sanityFetchMetadata({
    query,
    ...(params ? { params } : {}),
    perspective: "published",
  })) as { data: { title?: string | null } | null };

  const title = data?.title && getPageOgImageTitle(data.title);
  if (!title) return null;
  return target.kind === "blog" || target.kind === "category"
    ? getBlogPageTitle(title, target.page || 1)
    : title;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const target = parsePageOgImageTarget(path);
  const { searchParams } = new URL(request.url);
  if (!target || !hasExactQueryShape(searchParams)) return notFound();

  const version = searchParams.get("v") || "";
  const revision = searchParams.get("rev") || "";
  const signature = searchParams.get("sig") || "";
  if (
    version !== OG_IMAGE_VERSION ||
    !/^[A-Za-z0-9_-]{22}$/.test(revision) ||
    !verifyOgImageSignature({
      identity: { key: getPageOgImageKey(target), revision, version },
      secret: getOgImageSecret(),
      signature,
    })
  ) {
    return notFound();
  }

  try {
    const title = await fetchTitle(target);
    if (!title || createPageOgImageRevision(title) !== revision) return notFound();

    return await createOgImageResponse({
      eyebrow: siteName.toUpperCase(),
      title,
    });
  } catch (error) {
    return await ogImageFallbackResponse(error, "Page");
  }
}
