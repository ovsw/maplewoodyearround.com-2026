import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { contentActionsProjection, taglineProjection } from "./shared/maplewood";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const rateTableQuery = groq`
  _type == "rateTable" => {
    anchorId,
    ${taglineProjection},
    title,
    intro[]{${simpleRichTextQuery}},
    columns[]{_key, label, note, detail, image{${imageQuery}}},
    rows[]{_key, label, cells}, notes[]{${simpleRichTextQuery}}, ${contentActionsProjection}
  }
`;
