import { groq } from "next-sanity";
import { collectionItemsProjection } from "./shared/maplewood";

// @sanity-typegen-ignore
export const cardSliderQuery = groq`
  _type == "cardSlider" => {
    title,
    description,
source, program, ${collectionItemsProjection}
  }
`;
