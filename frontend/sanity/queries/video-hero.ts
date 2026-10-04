import { groq } from "next-sanity";
import {
  contentActionsProjection,
  sectionVideoProjection,
} from "./shared/maplewood";

// @sanity-typegen-ignore
export const videoHeroQuery = groq`
  _type == "videoHero" => {
    title, highlightText,
    description,
overlayOpacity, ${sectionVideoProjection}, ${contentActionsProjection}
  }
`;
