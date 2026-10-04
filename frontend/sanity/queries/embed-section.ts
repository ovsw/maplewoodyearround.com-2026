import { groq } from "next-sanity";
import { contentActionsProjection, taglineProjection } from "./shared/maplewood";
import { richTextContentQuery } from "./shared/rich-text-content";

// @sanity-typegen-ignore
export const embedSectionQuery = groq`
  _type == "embedSection" => {
    anchorId,
    ${taglineProjection},
    title,
    description,
    body[]{${richTextContentQuery}},
    embedUrl, frameTitle, provider, providerId, accountId, sentFrom, ${contentActionsProjection}
  }
`;
