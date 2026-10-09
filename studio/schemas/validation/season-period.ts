import type { ValidationContext } from "sanity";

type SeasonDocument = {
  _id?: string;
  program?: string;
  startDate?: string;
  endDate?: string;
};

type OverlappingSeason = {
  title?: string;
  startDate: string;
  endDate: string;
};

// Dates are inclusive days ("YYYY-MM-DD"), so a Season that ends the day
// before another starts leaves no shared day and is allowed.
export async function seasonPeriod(
  endDate: string | undefined,
  context: ValidationContext,
) {
  const season = context.document as SeasonDocument | undefined;
  const startDate = season?.startDate;
  if (!endDate || !startDate) return true;

  if (endDate < startDate) {
    return "The end date cannot be before the start date.";
  }

  const documentId = season?._id;
  if (!documentId || !season?.program) return true;

  // sanity::versionOf expects a published id; normalise drafts and release
  // versions (`versions.<releaseId>.<publishedId>`) down to it.
  const publishedId = documentId
    .replace(/^drafts\./, "")
    .replace(/^versions\.[^.]+\./, "");
  const client = context
    .getClient({ apiVersion: "2026-03-23" })
    .withConfig({ perspective: "raw" });
  const overlap = await client.fetch<OverlappingSeason | null>(
    `*[
      _type == "season" &&
      !sanity::versionOf($publishedId) &&
      program == $program &&
      startDate <= $endDate &&
      endDate >= $startDate
    ] | order(startDate asc)[0]{title, startDate, endDate}`,
    { publishedId, program: season.program, startDate, endDate },
  );

  return overlap
    ? `This Season overlaps ${overlap.title ?? "another Season"} (${overlap.startDate} to ${overlap.endDate}). Two Seasons of the same side cannot share a day.`
    : true;
}
