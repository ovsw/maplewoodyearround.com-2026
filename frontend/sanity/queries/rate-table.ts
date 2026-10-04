import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { contentActionsProjection, taglineProjection } from "./shared/maplewood";
import { richTextContentQuery } from "./shared/rich-text-content";

// @sanity-typegen-ignore
export const rateTableQuery = groq`
  _type == "rateTable" => {
    anchorId,
    ${taglineProjection},
    title,
    intro[]{${richTextContentQuery}},
    columns[]{_key, label, note, detail, image{${imageQuery}}},
    rows[]{_key, label, cells}, notes[]{${richTextContentQuery}}, ${contentActionsProjection}
  }
`;
