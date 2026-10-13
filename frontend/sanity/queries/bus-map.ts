import { groq } from "next-sanity";
import {
  contentActionsProjection,
  contentCardsProjection,
} from "./shared/maplewood";

// The section text, every Bus stop shown on the map (its switch is not off
// and it has a pin) and the Camp location from Global Settings. The map model
// sorts and links them. "stopList" points at the first page section that shows
// the stop list (the Bus page's #bus-map): Home and Contact link to it when
// their map is not available.
// @sanity-typegen-ignore
export const busMapQuery = groq`
  _type == "busMap" => {
    anchorId, title, eyebrow,
    description, showStopList,
    "stopList": *[_type == "page" && defined(slug.current) && count(blocks[_type == "busMap" && showStopList == true]) > 0][0]{
      "href": "/" + array::join(string::split(slug.current, "/")[@ != ""], "/")
        + coalesce("#" + blocks[_type == "busMap" && showStopList == true][0].anchorId, "")
    },
    ${contentCardsProjection}, ${contentActionsProjection},
    "stops": *[_type == "busStop" && shownOnMap != false && defined(location.lat) && defined(location.lng)]{
      _id, name, address, town, shownOnMap, location{lat, lng}
    },
    "camp": *[_type == "settings" && _id == "settings"][0].campLocation{
      name, address, location{lat, lng}
    }
  }
`;
