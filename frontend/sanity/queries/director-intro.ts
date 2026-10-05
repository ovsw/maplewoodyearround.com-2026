import { groq } from "next-sanity";
import { sectionVideoProjection } from "./shared/maplewood";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const directorIntroQuery = groq`
  _type == "directorIntro" => {
    panels[]{_key, title, body[]{${simpleRichTextQuery}}},
    ${sectionVideoProjection}
  }
`;
