import {
  OG_IMAGE_VERSION,
  createOgImageRevision,
  getOgImageSecret,
  isValidOgSlug,
  signOgImage,
} from "./post-og-image";
import { stripLegacySeoTitleSuffix } from "../../shared/seo-title";
import { siteName } from "./site-name";

export type PageOgImageTarget =
  | { kind: "home" }
  | { kind: "blog"; page?: number }
  | { kind: "page"; slug: string }
  | { kind: "category"; page?: number; slug: string };

export function getPageOgImageKey(target: PageOgImageTarget) {
  if (target.kind === "home") return "home";
  if (target.kind === "blog") return `blog:${target.page || 1}`;
  if (target.kind === "category") {
    return `category:${target.slug}:${target.page || 1}`;
  }
  return `page:${target.slug}`;
}

export function getPageOgImagePath(target: PageOgImageTarget) {
  if (target.kind === "home") return "home";
  if (target.kind === "blog") {
    return target.page && target.page > 1 ? `blog/${target.page}` : "blog";
  }
  const parts = [target.kind, ...target.slug.split("/").map(encodeURIComponent)];
  if (target.kind === "category" && target.page && target.page > 1) {
    parts.push(String(target.page));
  }
  return parts.join("/");
}

// Only the canonical decimal form is accepted ("2", never "02" or "2.0"), so every
// signed URL maps to exactly one path and cannot be rewritten into cache-key aliases.
function parseCanonicalPageNumber(value: string | undefined) {
  if (value === undefined) return 1;

  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 && String(page) === value
    ? page
    : null;
}

export function parsePageOgImageTarget(segments: string[]): PageOgImageTarget | null {
  if (segments.length === 1 && segments[0] === "home") return { kind: "home" };
  if (segments[0] === "blog" && segments.length <= 2) {
    const page = parseCanonicalPageNumber(segments[1]);
    return page === null ? null : { kind: "blog", page };
  }

  const [kind, ...slugSegments] = segments;
  const page = kind === "category" && slugSegments.length === 2
    ? parseCanonicalPageNumber(slugSegments.pop())
    : 1;
  const slug = slugSegments.join("/");
  if (
    (kind !== "page" && kind !== "category") ||
    !isValidOgSlug(slug) ||
    (kind === "category" && (slugSegments.length !== 1 || page === null))
  ) {
    return null;
  }

  return kind === "category" ? { kind, page: page ?? 1, slug } : { kind, slug };
}

export function createPageOgImageRevision(title: string) {
  return createOgImageRevision([title.trim()]);
}

export function getPageOgImageTitle(title: string) {
  return stripLegacySeoTitleSuffix(title, siteName);
}

export function buildPageOgImageUrl({
  origin,
  target,
  title,
  secret = getOgImageSecret(),
}: {
  origin: string;
  target: PageOgImageTarget;
  title: string;
  secret?: string;
}) {
  if (
    ((target.kind === "page" || target.kind === "category") &&
      !isValidOgSlug(target.slug)) ||
    // Nested category slugs would produce URLs the route parser rejects as 404s.
    (target.kind === "category" && target.slug.includes("/")) ||
    ((target.kind === "blog" || target.kind === "category") &&
      target.page !== undefined &&
      (!Number.isSafeInteger(target.page) || target.page < 1))
  ) {
    throw new Error("Cannot build an OG image URL for an invalid page target");
  }

  const revision = createPageOgImageRevision(title);
  const key = getPageOgImageKey(target);
  const url = new URL(`/api/og/page/${getPageOgImagePath(target)}`, origin);
  url.searchParams.set("v", OG_IMAGE_VERSION);
  url.searchParams.set("rev", revision);
  url.searchParams.set("sig", signOgImage({ key, revision }, secret));
  return url.toString();
}
