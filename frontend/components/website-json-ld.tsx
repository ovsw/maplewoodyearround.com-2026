import {
  createWebsiteJsonLd,
  serializeWebsiteJsonLd,
  type OrganizationDetails,
} from "@/lib/website-json-ld";

export default function WebsiteJsonLd({
  organization,
  siteUrl,
}: {
  organization?: OrganizationDetails;
  siteUrl: string;
}) {
  const value = createWebsiteJsonLd(siteUrl, organization);

  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeWebsiteJsonLd(value) }}
      type="application/ld+json"
    />
  );
}
