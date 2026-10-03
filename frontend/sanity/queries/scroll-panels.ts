import { groq } from "next-sanity";
import { contentCardsProjection } from "./shared/maplewood";

// @sanity-typegen-ignore
export const scrollPanelsQuery = groq`
  _type == "scrollPanels" => {
    title,
    description,
${contentCardsProjection}
  }
`;
