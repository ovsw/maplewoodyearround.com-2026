import { stegaClean } from "next-sanity";

const safeProtocols = new Set(["http:", "https:", "mailto:", "tel:"]);

export function getSafeLinkHref(value: unknown) {
  if (typeof value !== "string") return null;

  const href = stegaClean(value)?.trim();
  if (!href) return null;
  if (
    href.startsWith("#") ||
    (href.startsWith("/") && !href.startsWith("//") && href[1] !== "\\")
  ) {
    return href;
  }

  try {
    const url = new URL(href);
    if (["http:", "https:"].includes(url.protocol) && !/^https?:\/\//i.test(href)) {
      return null;
    }
    return safeProtocols.has(url.protocol) ? href : null;
  } catch {
    return null;
  }
}
