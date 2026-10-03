import { groq } from "next-sanity";
import { minimalRichTextQuery } from "./shared/minimal-rich-text";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const benefitCardsQuery = groq`
  _type == "benefitCards" => {
    eyebrow,
    title[]{
      ${minimalRichTextQuery}
    },
    intro,
    "cards": array::compact(cards[]{
      _key,
      _type,
      "icon": icon{ name, svg },
      title,
      body[]{
        ${simpleRichTextQuery}
      }
    })
  }
`;
