import { groq } from "next-sanity";
import { contentDestinationProjection } from "./shared/maplewood";
import { imageQuery } from "./shared/image";

// @sanity-typegen-ignore
export const programCardsQuery = groq`
  _type == "programCards" => {
    title,
    description,
program, listingGroup,
    "items": *[_type == "programOffering" && visible != false && (!defined(^.program) || program == ^.program) && (!defined(^.listingGroup) || listingGroup == ^.listingGroup)]
      | order(coalesce(order, 2147483647) asc, title asc, _id asc) {
        _id, title, slug, program, description, days, color,
        image{${imageQuery}}, destination${contentDestinationProjection}
      }
  }
`;
