import { groq } from "next-sanity";
import { contentActionsProjection, contentCardsProjection } from "./shared/maplewood";

// @sanity-typegen-ignore
export const instructionStepsQuery = groq`
  _type == "instructionSteps" => {
    title,
    description,
${contentCardsProjection}, ${contentActionsProjection}
  }
`;
