import { groq } from "next-sanity";
import { contentActionsProjection } from "./shared/maplewood";

// @sanity-typegen-ignore
export const embedSectionQuery = groq`
  _type == "embedSection" => {
    title,
    description,
embedUrl, frameTitle, provider, providerId, accountId, sentFrom, ${contentActionsProjection}
  }
`;
