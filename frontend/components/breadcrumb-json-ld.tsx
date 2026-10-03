import {
  createBreadcrumbJsonLd,
  serializeBreadcrumbJsonLd,
  type BreadcrumbJsonLdItem,
} from "@/lib/breadcrumb-json-ld";

export default function BreadcrumbJsonLd({
  items,
  siteUrl,
}: {
  items: readonly BreadcrumbJsonLdItem[];
  siteUrl: string;
}) {
  const value = createBreadcrumbJsonLd(items, siteUrl);
  if (!value) return null;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeBreadcrumbJsonLd(value) }}
      type="application/ld+json"
    />
  );
}
