import { groq } from "next-sanity";
import {
  contentActionsProjection,
  sectionVideoProjection,
} from "./shared/maplewood";
import { imageQuery } from "./shared/image";
import { richTextContentQuery } from "./shared/rich-text-content";

// @sanity-typegen-ignore
export const directorIntroQuery = groq`
  _type == "directorIntro" => {
    title,
    description,
${sectionVideoProjection}, image{${imageQuery}}, body[]{${richTextContentQuery}}, ${contentActionsProjection}
  }
`;
