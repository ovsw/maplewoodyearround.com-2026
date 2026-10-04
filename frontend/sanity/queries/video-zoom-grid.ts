import { groq } from "next-sanity";
import {
  contentActionsProjection,
  sectionVideoProjection,
  taglineProjection,
} from "./shared/maplewood";
import { imageQuery } from "./shared/image";

// @sanity-typegen-ignore
export const videoZoomGridQuery = groq`
  _type == "videoZoomGrid" => {
    ${taglineProjection},
    title, highlightText,
    description,
${sectionVideoProjection}, gridImages[]{${imageQuery}}, mobileImages[]{${imageQuery}}, ${contentActionsProjection}
  }
`;
