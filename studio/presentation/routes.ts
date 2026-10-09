import {
  categoryPath,
  pagePath,
  postPath,
  routedDocumentPath,
} from "../../shared/content-routes.ts";

const PRESENTATION_DOCUMENT_TYPES = new Set([
  "page",
  "post",
  "category",
  "blogIndex",
  "homePage",
  "parentDashboard",
  "campGroup",
]);

function readSlug(document: unknown) {
  if (!document || typeof document !== "object" || !("slug" in document)) {
    return undefined;
  }

  const slug = document.slug;
  if (!slug || typeof slug !== "object" || !("current" in slug)) {
    return undefined;
  }

  return typeof slug.current === "string" ? slug.current : undefined;
}

export function isPresentationDocumentType(documentType: string) {
  return PRESENTATION_DOCUMENT_TYPES.has(documentType);
}

export function resolveContentPath(value?: string | null) {
  return pagePath(value);
}

export function resolveCategoryPath(value?: string | null) {
  return categoryPath(value);
}

export function getPresentationPath(
  documentType: string,
  slug?: string | null,
) {
  if (documentType === "blogIndex") return "/news";
  if (documentType === "parentDashboard") return "/parent-dashboard";
  if (documentType === "campGroup")
    return "/summer-camp/summer-group-schedules";
  if (documentType === "homePage") return "/";
  if (!isPresentationDocumentType(documentType) || !slug?.trim()) return null;
  if (documentType === "page") return pagePath(slug);
  if (documentType === "post") return postPath(slug);
  if (documentType === "category") return routedDocumentPath("category", slug);
  return null;
}

export function getDocumentSlug(draft?: unknown, published?: unknown) {
  return draft ? readSlug(draft) : readSlug(published);
}
