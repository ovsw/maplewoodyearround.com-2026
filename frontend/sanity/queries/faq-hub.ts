import { groq } from "next-sanity";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// The hub has no FAQ reference list. It reads every FAQ that has a category
// (the active perspective decides whether drafts take part), joined with the
// category it belongs to, and sorted the way the page shows them: category
// order, then FAQ order (unset last), then the question text. `answerText`
// is the answer flattened once here so the search never flattens on a
// keystroke.
// @sanity-typegen-ignore
export const faqHubQuery = groq`
  _type == "faqHub" => {
    eyebrow,
    title[]{
      ...
    },
    subtitle,
    searchPlaceholder,
    emptyState,
    "faqs": *[_type == "faq" && defined(category->_id)]
      | order(category->order asc, coalesce(order, 2147483647) asc, lower(title) asc) {
        _id,
        title,
        "answer": body[]{
          ${simpleRichTextQuery}
        },
        "answerText": pt::text(body),
        order,
        "category": category->{
          _id,
          title,
          "slug": slug.current,
          order
        }
      }
  }
`;
