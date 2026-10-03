import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";

// @sanity-typegen-ignore
export const headingImageQuery = groq`
  _type == "headingImage" => {
    title,
    background,
    richText[]{ ... },
    image { ${imageQuery} }
  }
`;
