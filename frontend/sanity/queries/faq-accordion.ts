import { groq } from "next-sanity";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const faqAccordionQuery = groq`
  _type == "faqAccordion" => {
    eyebrow,
    title[]{
      ...
    },
    subtitle,
    "faqs": array::compact(faqs[]{
      _key,
      "_id": @->._id,
      "_type": @->._type,
      "title": @->.title,
      "answer": coalesce(@->.body, @->.richText)[]{
        ${simpleRichTextQuery}
      }
    })
  }
`;
