import { groq } from "next-sanity";
import { contentDestinationProjection, taglineProjection } from "./shared/maplewood";
import { imageQuery } from "./shared/image";

// @sanity-typegen-ignore
export const programCardsQuery = groq`
  _type == "programCards" => {
    anchorId,
    "breadcrumbs": array::compact(breadcrumbs[]{
      _key, label, program, destination${contentDestinationProjection}
    }),
    ${taglineProjection},
    title,
    description,
program, listingGroup,
    "items": *[_type == "programOffering" && visible != false && (!defined(^.program) || program == ^.program) && (!defined(^.listingGroup) || listingGroup == ^.listingGroup)]
      | order(coalesce(order, 2147483647) asc, title asc, _id asc) {
        _id, title, label, slug, program, description, days, color, linkLabel,
        image{${imageQuery}}, destination${contentDestinationProjection}
      }
  }
`;
