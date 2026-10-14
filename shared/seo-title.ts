export const SITE_NAME = "Maplewood";

const IMPORTANT_TERMS = ["website", "company", "service"] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeSeoTitle(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ") || "";
}

/** Removes only recognized, trailing legacy brand phrases during migration. */
export function stripLegacySeoTitleSuffix(
  value: string | null | undefined,
  siteName = SITE_NAME,
) {
  let title = normalizeSeoTitle(value);
  let previousTitle = "";
  const recognizedSiteNames = new Set([siteName, SITE_NAME]);

  while (title && title !== previousTitle) {
    previousTitle = title;
    for (const recognizedSiteName of recognizedSiteNames) {
      title = title
        .replace(
          new RegExp(
            `\\s*(?:\\||-)\\s*${escapeRegExp(recognizedSiteName)}$`,
            "i",
          ),
          "",
        )
        .trim();
    }
  }

  return title;
}

export function resolveSeoTitle({
  fallbackTitle,
  isHomepage = false,
  overrideTitle,
  siteName = SITE_NAME,
}: {
  fallbackTitle?: string | null;
  isHomepage?: boolean;
  overrideTitle?: string | null;
  siteName?: string;
}) {
  const normalizedOverride = normalizeSeoTitle(overrideTitle);
  const hasManualSuffix = normalizedOverride.includes("|");
  const pageTitle = hasManualSuffix
    ? normalizedOverride
    : stripLegacySeoTitleSuffix(normalizedOverride, siteName) ||
      stripLegacySeoTitleSuffix(fallbackTitle, siteName) ||
      siteName;
  // Webflow used each SEO title exactly as written, and search engines know
  // the pages by those titles. Only the content title fallback gets the suffix.
  const finalTitle = normalizedOverride
    ? normalizedOverride
    : pageTitle.toLowerCase() === siteName.toLowerCase()
      ? siteName
      : `${pageTitle} | ${siteName}`;

  return {
    finalTitle,
    // Absolute titles bypass the layout template so the default suffix is not
    // added to an override or added twice.
    metadataTitle:
      isHomepage || normalizedOverride || finalTitle === siteName
        ? { absolute: finalTitle }
        : pageTitle,
    openGraphTitle: finalTitle,
    pageTitle,
    twitterTitle: finalTitle,
  } as const;
}

export function getSeoTitleWarnings({
  fallbackTitle,
  overrideTitle,
  siteName = SITE_NAME,
}: {
  fallbackTitle?: string | null;
  overrideTitle?: string | null;
  siteName?: string;
}) {
  const { finalTitle, pageTitle } = resolveSeoTitle({
    fallbackTitle,
    overrideTitle,
    siteName,
  });
  const warnings: string[] = [];
  const lowerTitle = pageTitle.toLowerCase();
  const repeatedTerm = IMPORTANT_TERMS.find((term) => {
    const matches = lowerTitle.match(new RegExp(`\\b${term}s?\\b`, "g"));
    return (matches?.length || 0) > 1;
  });
  if (repeatedTerm) {
    warnings.push(`Review the repeated term “${repeatedTerm}” for readability.`);
  }

  if (finalTitle.length > 60) {
    warnings.push(
      `The final ${finalTitle.length}-character title may be shortened in search results.`,
    );
  }

  return warnings;
}
