import { defineQuery } from "next-sanity";

const seasonProjection = `{_id, title, slug, program, startDate, endDate}`;

/*
 * The current and the next Season of each side on `$today` ("YYYY-MM-DD",
 * Maplewood's local date). Dates are inclusive. Seasons are not back-to-back,
 * so `current` is null on a day between Seasons; a Season without both
 * dates is never current or next. The Studio blocks overlaps within a side.
 */
export const SEASONS_QUERY = defineQuery(`{
  "summerCamp": {
    "current": *[_type == "season" && program == "summerCamp" && startDate <= $today && endDate >= $today] | order(startDate asc)[0]${seasonProjection},
    "next": *[_type == "season" && program == "summerCamp" && startDate > $today && defined(endDate)] | order(startDate asc)[0]${seasonProjection}
  },
  "schoolYear": {
    "current": *[_type == "season" && program == "schoolYear" && startDate <= $today && endDate >= $today] | order(startDate asc)[0]${seasonProjection},
    "next": *[_type == "season" && program == "schoolYear" && startDate > $today && defined(endDate)] | order(startDate asc)[0]${seasonProjection}
  }
}`);
