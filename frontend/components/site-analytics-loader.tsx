import { draftMode } from "next/headers";
import { fetchSanitySettings } from "@/sanity/lib/fetch";
import { SiteAnalytics } from "./site-analytics";

export async function SiteAnalyticsLoader() {
  if (
    process.env.VERCEL_ENV !== "production" ||
    process.env.NEXT_PUBLIC_SITE_ENV !== "production"
  )
    return null;
  const { isEnabled } = await draftMode();
  if (isEnabled) return null;
  const settings = await fetchSanitySettings({
    perspective: "published",
    stega: false,
  });
  return <SiteAnalytics settings={settings} />;
}
