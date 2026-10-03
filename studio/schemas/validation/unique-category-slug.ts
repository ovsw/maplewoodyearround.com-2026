import type { ValidationContext } from "sanity";

type SlugValue = { current?: string };

const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function uniqueCategorySlug(
  value: SlugValue | undefined,
  context: ValidationContext,
) {
  const current = value?.current;
  if (!current) return true;

  if (/^\d+$/.test(current)) {
    return "Category slugs cannot contain only numbers";
  }

  if (!CATEGORY_SLUG_PATTERN.test(current)) {
    return "Use lowercase letters, numbers, and single hyphens only";
  }

  const documentId = context.document?._id;
  if (!documentId) return true;

  // sanity::versionOf expects a published id; normalise drafts and release
  // versions (`versions.<releaseId>.<publishedId>`) down to it.
  const publishedId = documentId.replace(/^drafts\./, "").replace(/^versions\.[^.]+\./, "");
  const client = context
    .getClient({ apiVersion: "2026-03-23" })
    .withConfig({ perspective: "raw" });
  const collision = await client.fetch<{
    _id: string;
    slug: string;
  } | null>(
    // Exclude every version of this category, not just published + draft. Under
    // the raw perspective a content release also surfaces
    // `versions.<releaseId>.<publishedId>`, which an id-list exclusion misses —
    // the category would collide with its own release version.
    `*[
      _type == "category" &&
      !sanity::versionOf($publishedId) &&
      slug.current == $slug
    ][0]{_id, "slug": slug.current}`,
    { publishedId, slug: current },
  );

  return collision
    ? `This slug is already used by another category: ${collision.slug}`
    : true;
}
