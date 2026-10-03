import { groq } from "next-sanity";
import {
  contentActionsProjection,
  contentCardsProjection,
} from "./shared/maplewood";

// @sanity-typegen-ignore
export const electiveCardsQuery = groq`
  _type == "electiveCards" => {
    title,
    description,
${contentCardsProjection}, ${contentActionsProjection}
  }
`;
