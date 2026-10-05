import ParentDashboard from "@/components/parent-dashboard";
import MissingSanityPage from "@/components/ui/missing-sanity-page";
import { fetchParentDashboard } from "@/sanity/lib/fetch";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  type DynamicFetchOptions,
} from "@/sanity/lib/live";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import { fetchSeoSettings } from "@/sanity/lib/seo-settings";
import { PARENT_DASHBOARD_QUERY } from "@/sanity/queries/parent-dashboard";
import type { PARENT_DASHBOARD_QUERY_RESULT } from "@/sanity.types";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

export async function generateMetadata() {
  const [{ data: page }, settings] = await Promise.all([
    sanityFetchMetadata({
      query: PARENT_DASHBOARD_QUERY,
      perspective: "published",
    }) as Promise<{ data: PARENT_DASHBOARD_QUERY_RESULT }>,
    fetchSeoSettings(),
  ]);
  if (!page) return {};

  return generatePageMetadata({ page, path: "/parent-dashboard", settings });
}

export default async function ParentDashboardPage() {
  const { isEnabled: isDraftMode } = await draftMode();
  if (isDraftMode) return <DynamicParentDashboard />;

  return <CachedParentDashboard perspective="published" stega={false} />;
}

async function DynamicParentDashboard() {
  const options = await getDynamicFetchOptions();
  return <CachedParentDashboard {...options} />;
}

async function CachedParentDashboard({ perspective, stega }: DynamicFetchOptions) {
  const dashboard = await fetchParentDashboard({ perspective, stega });
  if (!dashboard) {
    if (perspective === "published") notFound();
    return MissingSanityPage({ document: "parentDashboard", documentId: "parentDashboard" });
  }

  return <ParentDashboard dashboard={dashboard} stega={stega} />;
}
