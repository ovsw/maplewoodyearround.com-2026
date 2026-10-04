import { groq } from "next-sanity";
import { contentActionsProjection } from "./shared/maplewood";
import { richTextContentQuery } from "./shared/rich-text-content";

// @sanity-typegen-ignore
export const pricingCardsQuery = groq`
  _type == "pricingCards" => {
    title,
    description,
plans[]{_key, title, price, details[]{${richTextContentQuery}}, ${contentActionsProjection}}
  }
`;
