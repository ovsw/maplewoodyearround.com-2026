import { groq } from "next-sanity";
import { contentActionsProjection } from "./shared/maplewood";
import { imageQuery } from "./shared/image";

// @sanity-typegen-ignore
export const imageRevealQuery = groq`
  _type == "imageReveal" => {
    title,
    description,
image{${imageQuery}}, ${contentActionsProjection}
  }
`;
