import { groq } from "next-sanity";
import { collectionItemsProjection } from "./shared/maplewood";

// @sanity-typegen-ignore
export const filterableCardsQuery = groq`
  _type == "filterableCards" => {
    title,
    description,
source, program, searchPlaceholder, emptyState, ${collectionItemsProjection}
  }
`;
