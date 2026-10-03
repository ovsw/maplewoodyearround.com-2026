import Blocks from "@/components/blocks";
import FaqPageJsonLd from "@/components/faq-json-ld";
import VideoJsonLd from "@/components/video-json-ld";
import WebsiteJsonLd from "@/components/website-json-ld";
import { siteUrl } from "@/lib/site-url";
import { fetchHomePage } from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import { fetchSeoSettings } from "@/sanity/lib/seo-settings";
import MissingSanityPage from "@/components/ui/missing-sanity-page";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  type DynamicFetchOptions,
} from "@/sanity/lib/live";
import { HOME_PAGE_QUERY_RESULT } from "@/sanity.types";
import { HOME_PAGE_QUERY } from "@/sanity/queries/home-page";
import { draftMode } from "next/headers";
import { siteName } from "@/lib/site-name";

export async function generateMetadata() {
  const [{ data: page }, settings] = await Promise.all([
    sanityFetchMetadata({
      query: HOME_PAGE_QUERY,
      perspective: "published",
    }) as Promise<{ data: HOME_PAGE_QUERY_RESULT }>,
    fetchSeoSettings(),
  ]);

  return generatePageMetadata({ page, path: "/", settings });
}

export default async function IndexPage() {
  const { isEnabled: isDraftMode } = await draftMode();

  if (isDraftMode) {
    return <DynamicIndexPage />;
  }

  return <CachedIndexPage perspective="published" stega={false} />;
}

async function DynamicIndexPage() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedIndexPage perspective={perspective} stega={stega} />;
}

async function CachedIndexPage({ perspective, stega }: DynamicFetchOptions) {
  const page = await fetchHomePage({ perspective, stega });

  if (!page) {
    if (perspective === "published") {
      return (
        <section className="container-content py-section">
          <h1 className="text-3xl font-semibold">{siteName}</h1>
          <p className="mt-4">Our new website is being prepared.</p>
        </section>
      );
    }
    return MissingSanityPage({ document: "homePage", documentId: "homePage" });
  }

  const blocks = page.blocks ?? [];
  const hasHero = blocks.some(
    (block) => block._type === "homeHero" || block._type === "hero",
  );

  return (
    <>
      <WebsiteJsonLd siteUrl={siteUrl} />
      <FaqPageJsonLd blocks={blocks} />
      <VideoJsonLd content={blocks} />
      {!hasHero ? <h1>{page.title}</h1> : null}
      <Blocks
        blocks={blocks}
        documentId={page._id}
        documentType="homePage"
        perspective={perspective}
        stega={stega}
      />
    </>
  );
}
