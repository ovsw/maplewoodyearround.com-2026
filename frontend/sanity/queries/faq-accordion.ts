import { groq } from "next-sanity";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const faqAccordionQuery = groq`
  _type == "faqAccordion" => {
    eyebrow, title[]{...}, subtitle,
    "faqs": *[
      _type == "faq"
      && (!defined(^.program) || program == ^.program)
      && (!defined(^.category._ref) || ^.category._ref in categories[]._ref || category._ref == ^.category._ref)
    ] | order(coalesce(order, 2147483647) asc, title asc, _id asc) {
      "_key": _id, _id, _type, title,
      "answer": body[]{${simpleRichTextQuery}}
    }
  }
`;
