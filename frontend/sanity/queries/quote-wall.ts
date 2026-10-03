import { groq } from "next-sanity";
import { testimonialReferencesQuery } from "./shared/testimonial-references";

// @sanity-typegen-ignore
export const quoteWallQuery = groq`
  _type == "quoteWall" => {
    eyebrow,
    heading[]{
      ...
    },
    ${testimonialReferencesQuery}
  }
`;
