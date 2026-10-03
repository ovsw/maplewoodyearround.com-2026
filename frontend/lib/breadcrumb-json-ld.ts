export type BreadcrumbJsonLdItem = {
  name: string;
  path: string;
};

export type BreadcrumbJsonLd = {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
};

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/$/, "");
}

function normalizePath(path: string) {
  const cleanPath = path.trim();
  if (cleanPath === "/") return "/";
  return `/${cleanPath.replace(/^\/+|\/+$/g, "")}`;
}

export function createBreadcrumbJsonLd(
  items: readonly BreadcrumbJsonLdItem[],
  siteUrl: string,
): BreadcrumbJsonLd | null {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const usableItems = items
    .map((item) => ({
      name: item.name.trim(),
      path: normalizePath(item.path),
    }))
    .filter((item) => item.name);

  if (usableItems.length < 2) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: usableItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${normalizedSiteUrl}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

export function serializeBreadcrumbJsonLd(value: BreadcrumbJsonLd) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
