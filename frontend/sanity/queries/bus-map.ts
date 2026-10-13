import { groq } from "next-sanity";
import {
  contentActionsProjection,
  contentCardsProjection,
} from "./shared/maplewood";

// The section text plus every Bus stop shown on the map: its switch is not
// off and it has a pin. The map model sorts and links them.
// @sanity-typegen-ignore
export const busMapQuery = groq`
  _type == "busMap" => {
    title, eyebrow,
    description,
    ${contentCardsProjection}, ${contentActionsProjection},
    "stops": *[_type == "busStop" && shownOnMap != false && defined(location.lat) && defined(location.lng)]{
      _id, name, address, town, shownOnMap, location{lat, lng}
    }
  }
`;
