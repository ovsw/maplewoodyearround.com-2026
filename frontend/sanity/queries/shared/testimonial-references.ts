import { groq } from "next-sanity";
import { imageQuery } from "./image";
import { simpleRichTextQuery } from "./simple-rich-text";

/**
 * Projection for an array of references to Testimonial documents. Shared by
 * every section that quotes people, so they all read the same fields.
 */
export const testimonialReferencesQuery = groq`
  testimonials[]{
    _key,
    _type,
    "_ref": _ref,
    "document": @->{
      _id,
      _type,
      name,
      title,
      origin,
      rating,
      image{
        ${imageQuery}
      },
      body[]{
        ${simpleRichTextQuery}
      }
    }
  }
`;
