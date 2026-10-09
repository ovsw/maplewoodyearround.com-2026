import { groq } from "next-sanity";
import { fileUrl } from "./shared/file-url";

// Each Grade in school order, with the visible Camp groups that have a PDF of
// the section's kind. A group with two Grades shows under both.
// `season` is the title of the current Summer Camp Season, else the next one
// (see SEASONS_QUERY), and null while no Season has dates. GROQ has no time
// zones, so the day changes at midnight UTC.
// @sanity-typegen-ignore
export const summerDocumentListQuery = groq`
  _type == "summerDocumentList" => {
    title,
    description,
    kind,
    "season": *[
      _type == "season" && program == "summerCamp"
      && defined(startDate) && endDate >= string::split(now(), "T")[0]
    ] | order(startDate asc)[0].title,
    "grades": *[_type == "grade"] | order(order asc, title asc){
      _id,
      title,
      "groups": *[_type == "campGroup" && visible != false && ^._id in grades[]._ref]
        | order(order asc, title asc){
          _id,
          title,
          "file": select(^.^.kind == "welcomeLetter" => welcomeLetter, groupSchedule)
        }{_id, title, "fileUrl": ${fileUrl}}[defined(fileUrl)]
    }[count(groups) > 0]
  }
`;
