import {
  createWebsiteJsonLd,
  serializeWebsiteJsonLd,
} from "@/lib/website-json-ld";

export default function WebsiteJsonLd({ siteUrl }: { siteUrl: string }) {
  const value = createWebsiteJsonLd(siteUrl);

  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeWebsiteJsonLd(value) }}
      type="application/ld+json"
    />
  );
}
