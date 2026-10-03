import { groq } from "next-sanity";
import { contentDestinationProjection } from "./shared/maplewood";
import { richTextContentQuery } from "./shared/rich-text-content";

// @sanity-typegen-ignore
export const jobListQuery = groq`
  _type == "jobList" => {
    title,
    description,
program,
    "items": *[_type == "jobOpportunity" && visible != false && (!defined(^.program) || ^.program in programs)]
      | order(coalesce(order, 2147483647) asc, title asc, _id asc) {
        _id, title, programs, seasonal,
        description[]{${richTextContentQuery}}, applyLink${contentDestinationProjection}
      }
  }
`;
