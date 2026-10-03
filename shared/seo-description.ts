export type SeoDescriptionSource = "seo" | "content" | "site";

function normalizeDescription(value: string | null | undefined) {
  return value?.trim() || undefined;
}

/**
 * Picks the one description used for search, Open Graph, and Twitter.
 * Empty and whitespace-only values count as unset.
 */
export function resolveSeoDescription({
  contentDescription,
  seoDescription,
  siteDescription,
}: {
  contentDescription?: string | null;
  seoDescription?: string | null;
  siteDescription?: string | null;
}): { description?: string; source?: SeoDescriptionSource } {
  const candidates = [
    ["seo", seoDescription],
    ["content", contentDescription],
    ["site", siteDescription],
  ] as const;

  for (const [source, value] of candidates) {
    const description = normalizeDescription(value);
    if (description) return { description, source };
  }

  return {};
}

/** Matches GROQ `pt::text()`: block text joined by blank lines. */
export function portableTextToPlainText(value: unknown) {
  if (!Array.isArray(value)) return typeof value === "string" ? value : "";

  return value
    .filter((block) => block?._type === "block" && Array.isArray(block.children))
    .map((block) =>
      block.children
        .map((child: { text?: unknown }) =>
          typeof child?.text === "string" ? child.text : "",
        )
        .join(""),
    )
    .join("\n\n");
}
