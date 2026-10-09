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
    source, program, characterTime, ${collectionItemsProjection},
    // The calendar days list links the current printable calendar.
    "calendar": select(source == "playgroundEvent" => *[_type == "playgroundCalendar" && defined(file.asset)]
      | order(effectiveFrom desc)[0]{_id, title, "fileUrl": coalesce(file.asset->url + "/" + file.asset->originalFilename, file.asset->url)})
  }
`;
