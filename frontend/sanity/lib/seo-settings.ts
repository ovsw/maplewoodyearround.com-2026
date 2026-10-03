import { sanityFetchMetadata } from "@/sanity/lib/live";
import { SEO_SETTINGS_QUERY } from "@/sanity/queries/settings";
import type { SEO_SETTINGS_QUERY_RESULT } from "@/sanity.types";

export async function fetchSeoSettings() {
  const { data } = (await sanityFetchMetadata({
    query: SEO_SETTINGS_QUERY,
    perspective: "published",
  })) as { data: SEO_SETTINGS_QUERY_RESULT };
  return data;
}
