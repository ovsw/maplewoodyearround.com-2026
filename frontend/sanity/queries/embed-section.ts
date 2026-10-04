import { groq } from "next-sanity";
import { contentActionsProjection, taglineProjection } from "./shared/maplewood";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const embedSectionQuery = groq`
  _type == "embedSection" => {
    anchorId,
    ${taglineProjection},
    title,
    description,
    body[]{${simpleRichTextQuery}},
    embedUrl, frameTitle, provider, providerId, accountId, sentFrom, ${contentActionsProjection}
  }
`;
