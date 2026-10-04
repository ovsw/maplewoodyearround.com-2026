import { groq } from "next-sanity";
import { richTextContentQuery } from "./shared/rich-text-content";

// Keep every category for the Maplewood filter. The first category also feeds
// the existing generic hub renderer until the page issue replaces its layout.
// @sanity-typegen-ignore
export const faqHubQuery = groq`
  _type == "faqHub" => {
    eyebrow, title[]{...}, subtitle, searchPlaceholder, emptyState,
    "faqs": *[_type == "faq" && (!defined(^.program) || program == ^.program)
      && (count(categories) > 0 || defined(category._ref))]
      | order(coalesce(order, 2147483647) asc, title asc, _id asc) {
        _id, title, program, order,
        "answer": body[]{${richTextContentQuery}},
        "answerText": pt::text(body),
        "category": coalesce(categories[0]->, category->){_id, title, "slug": slug.current, order},
        "categories": categories[]->{_id, title, "slug": slug.current, order}
      }
  }
`;
