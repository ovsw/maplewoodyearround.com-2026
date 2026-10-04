import { groq } from "next-sanity";
import { contentCardsProjection } from "./shared/maplewood";

// @sanity-typegen-ignore
export const tabbedHeroQuery = groq`
  _type == "tabbedHero" => {
    title,
    description,
    ${contentCardsProjection}
  }
`;
