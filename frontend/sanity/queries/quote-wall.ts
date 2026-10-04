import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const quoteWallQuery = groq`
  _type == "quoteWall" => {
    eyebrow, description, heading[]{...},
    "testimonials": *[_type == "testimonial" && visible != false && (!defined(^.program) || program == ^.program)]
      | order(coalesce(order, 2147483647) asc, name asc, _id asc) {
        "_key": _id, "_type": "reference", "_ref": _id,
        "document": {_id, _type, name, title, origin, rating, pluralParents,
          image{${imageQuery}}, body[]{${simpleRichTextQuery}}
        }
      }
  }
`;
