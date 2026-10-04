import { groq } from "next-sanity";
import {
  collectionItemsProjection,
  contentActionsProjection,
  iconProjection,
  taglineProjection,
} from "./shared/maplewood";

// @sanity-typegen-ignore
export const cardSliderQuery = groq`
  _type == "cardSlider" => {
    anchorId,
    ${taglineProjection},
    ${iconProjection},
    accent,
    title,
    description,
    ${contentActionsProjection},
    source, program, ${collectionItemsProjection}
  }
`;
