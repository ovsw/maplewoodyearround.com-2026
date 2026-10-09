import { groq } from "next-sanity";
import {
  collectionItemsProjection,
  contentActionsProjection,
  iconProjection,
  sampleScheduleProjection,
  taglineProjection,
} from "./shared/maplewood";
import { fileUrl } from "./shared/file-url";

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
    "schedule": select(source == "sampleSchedule" => ${sampleScheduleProjection}),
    // The calendar days list links the current printable calendar.
    "calendar": select(source == "playgroundEvent" => *[_type == "playgroundCalendar" && defined(file.asset)]
      | order(effectiveFrom desc)[0]{_id, title, "fileUrl": ${fileUrl}})
  }
`;
