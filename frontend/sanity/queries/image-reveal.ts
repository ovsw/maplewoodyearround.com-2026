import { groq } from "next-sanity";
import { contentActionsProjection } from "./shared/maplewood";
import { imageQuery } from "./shared/image";
import { richTextContentQuery } from "./shared/rich-text-content";

// @sanity-typegen-ignore
export const imageRevealQuery = groq`
  _type == "imageReveal" => {
    title, eyebrow, body[]{${richTextContentQuery}},
    description,
image{${imageQuery}}, ${contentActionsProjection}
  }
`;
