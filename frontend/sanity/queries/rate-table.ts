import { groq } from "next-sanity";
import { contentActionsProjection } from "./shared/maplewood";
import { richTextContentQuery } from "./shared/rich-text-content";

// @sanity-typegen-ignore
export const rateTableQuery = groq`
  _type == "rateTable" => {
    title,
    description,
columns, rows[]{_key, label, cells}, notes[]{${richTextContentQuery}}, ${contentActionsProjection}
  }
`;
