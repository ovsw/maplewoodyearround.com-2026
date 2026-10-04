import { groq } from "next-sanity";
import {
  contentActionsProjection,
  contentCardsProjection,
} from "./shared/maplewood";

// @sanity-typegen-ignore
export const busMapQuery = groq`
  _type == "busMap" => {
    title,
    description,
embedUrl, ${contentCardsProjection}, ${contentActionsProjection}
  }
`;
