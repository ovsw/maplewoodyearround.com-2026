import type { ValidationContext } from "sanity";

// The Website shows a Play Center day by its UTC calendar day, so two days
// with different times on the same UTC date are the same calendar day.
export async function onePlayCenterDayPerDate(
  date: string | undefined,
  context: ValidationContext,
) {
  const documentId = context.document?._id;
  if (!date || !documentId) return true;

  // sanity::versionOf expects a published id; normalise drafts and release
  // versions (`versions.<releaseId>.<publishedId>`) down to it.
  const publishedId = documentId
    .replace(/^drafts\./, "")
    .replace(/^versions\.[^.]+\./, "");
  const day = date.slice(0, 10);
  const client = context
    .getClient({ apiVersion: "2026-03-23" })
    .withConfig({ perspective: "raw" });
  const other = await client.fetch<{ _id: string; title?: string } | null>(
    `*[
      _type == "playgroundEvent" &&
      !sanity::versionOf($publishedId) &&
      string::startsWith(date, $day)
    ] | order(_id asc)[0]{_id, title}`,
    { publishedId, day },
  );

  return other
    ? `${other.title ?? other._id} is already the Play Center day for ${day}. Each calendar day has one Play Center day.`
    : true;
}
