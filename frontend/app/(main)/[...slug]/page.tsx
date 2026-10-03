import { RootContentView } from "@/components/root-content";
import { isReservedPagePath, isRouteSlug, pagePath } from "@/lib/routes";
import {
  fetchSanityPageBySlug,
  PAGES_SLUGS_QUERY,
} from "@/sanity/lib/fetch";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
  type DynamicFetchOptions,
} from "@/sanity/lib/live";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import { fetchSeoSettings } from "@/sanity/lib/seo-settings";
import { PAGE_QUERY } from "@/sanity/queries/page";
import type {
  PAGE_QUERY_RESULT,
  PAGES_SLUGS_QUERY_RESULT,
} from "@/sanity.types";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

export const instant = false;

function readPageSlug(segments: string[]) {
  if (!segments.length || !segments.every(isRouteSlug)) return null;
  const slug = segments.join("/");
  const path = pagePath(slug);
  return path && !isReservedPagePath(path) ? slug : null;
}

export async function generateStaticParams() {
  const { data: pages } = (await sanityFetchStaticParams({
    query: PAGES_SLUGS_QUERY,
  })) as { data: PAGES_SLUGS_QUERY_RESULT };

  const params = pages.flatMap((page) => {
    const slug = page.slug?.current?.replace(/^\/+|\/+$/g, "");
    const segments = slug?.split("/") ?? [];
    return slug && readPageSlug(segments) ? [{ slug: segments }] : [];
  });
  // Cache Components requires a build sample, even for an empty dataset.
  // This invalid slug takes the normal notFound path and creates no content.
  return params.length ? params : [{ slug: ["__placeholder__"] }];
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug: segments } = await props.params;
  const slug = readPageSlug(segments);
  if (!slug) return {};

  const [{ data: page }, settings] = await Promise.all([
    sanityFetchMetadata({
      query: PAGE_QUERY,
      params: { slug },
      perspective: "published",
    }) as Promise<{ data: PAGE_QUERY_RESULT }>,
    fetchSeoSettings(),
  ]);
  // The page renderer owns 404s. Metadata only sees published content, so a
  // 404 here would prevent draft-only routes from reaching Presentation.
  if (!page) return {};
  const path = pagePath(slug);
  if (!path) return {};

  return generatePageMetadata({ page, path, settings });
}

export default async function PageRoute(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const { isEnabled: isDraftMode } = await draftMode();
  if (isDraftMode) return <DynamicPage params={props.params} />;

  const { slug: segments } = await props.params;
  const slug = readPageSlug(segments);
  if (!slug) notFound();
  return <CachedPage slug={slug} perspective="published" stega={false} />;
}

async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const [{ slug: segments }, options] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  const slug = readPageSlug(segments);
  if (!slug) notFound();
  return <CachedPage slug={slug} {...options} />;
}

async function CachedPage({
  slug,
  perspective,
  stega,
}: { slug: string } & DynamicFetchOptions) {
  const page = await fetchSanityPageBySlug({ slug, perspective, stega });
  if (!page) notFound();

  return (
    <RootContentView
      content={page}
      perspective={perspective}
      stega={stega}
    />
  );
}
