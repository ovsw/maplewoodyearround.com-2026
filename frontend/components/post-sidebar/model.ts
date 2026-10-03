import type { PortableTextProps } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import type { BLOG_POST_SETTINGS_QUERY_RESULT } from "@/sanity.types";

export type PostHeading = {
  children: PostHeading[];
  id: string;
  level: number;
  text: string;
};

export type PostBodyModel = {
  getHeadingId: (block: { _key?: string }) => string | undefined;
  headings: PostHeading[];
  showTableOfContents: boolean;
};

export type BlogPostSidebar = NonNullable<BLOG_POST_SETTINGS_QUERY_RESULT>;

export function getBlogPostSidebar(
  settings: BLOG_POST_SETTINGS_QUERY_RESULT,
): BlogPostSidebar | null {
  return settings ?? null;
}

const HEADING_STYLES = new Set(["h2", "h3", "h4", "h5", "h6"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getHeadingText(block: Record<string, unknown>) {
  if (!Array.isArray(block.children)) return "";

  return block.children
    .flatMap((child) => {
      if (!isRecord(child) || child._type !== "span" || typeof child.text !== "string") {
        return [];
      }
      const cleaned = stegaClean(child.text);
      return typeof cleaned === "string" ? [cleaned] : [];
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyHeading(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nestHeadings(flatHeadings: PostHeading[]) {
  const roots: PostHeading[] = [];
  const stack: PostHeading[] = [];

  for (const heading of flatHeadings) {
    while (stack.length && stack.at(-1)!.level >= heading.level) {
      stack.pop();
    }

    const parent = stack.at(-1);
    if (parent) parent.children.push(heading);
    else roots.push(heading);
    stack.push(heading);
  }

  return roots;
}

export function createPostBodyModel(value: PortableTextProps["value"]): PostBodyModel {
  const blocks = Array.isArray(value) ? value : [];
  const headingIdsByBlock = new WeakMap<object, string>();
  const headingIdsByKey: Record<string, string> = {};
  const usedIds = new Set<string>();
  const flatHeadings: PostHeading[] = [];

  for (const block of blocks) {
    if (!isRecord(block) || block._type !== "block" || !HEADING_STYLES.has(String(block.style))) {
      continue;
    }

    const text = getHeadingText(block);
    if (!text) continue;

    const headingNumber = flatHeadings.length + 1;
    const baseSlug = slugifyHeading(text) || `heading-${headingNumber}`;
    let id = baseSlug;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    headingIdsByBlock.set(block, id);

    if (typeof block._key === "string" && block._key) {
      headingIdsByKey[block._key] = id;
    }
    flatHeadings.push({ children: [], id, level: Number(String(block.style).slice(1)), text });
  }

  return {
    getHeadingId: (block) =>
      (block._key ? headingIdsByKey[block._key] : undefined) ?? headingIdsByBlock.get(block),
    headings: nestHeadings(flatHeadings),
    showTableOfContents: flatHeadings.length >= 3,
  };
}

export function getPostReadTime(value: PortableTextProps["value"]) {
  const blocks = Array.isArray(value) ? value : [];
  let wordCount = 0;

  for (const block of blocks) {
    if (!isRecord(block) || block._type !== "block" || !Array.isArray(block.children)) {
      continue;
    }

    for (const child of block.children) {
      if (!isRecord(child) || child._type !== "span" || typeof child.text !== "string") {
        continue;
      }

      const text = stegaClean(child.text)?.trim();
      if (text) wordCount += text.split(/\s+/).length;
    }
  }

  return `${Math.max(1, Math.round(wordCount / 200))} min read`;
}
