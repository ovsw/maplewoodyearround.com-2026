import { groq } from "next-sanity";
import { contentActionsProjection, contentDestinationProjection, iconProjection, taglineProjection } from "./shared/maplewood";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const registrationCardsQuery = groq`
  _type == "registrationCards" => {
    anchorId,
    ${taglineProjection},
    ${iconProjection},
    accent,
    title,
    intro[]{${simpleRichTextQuery}},
    ${contentActionsProjection},
    cards[]{
      _key, ${iconProjection}, accent, title,
      body[]{${simpleRichTextQuery}},
      "links": links[]{_key, label, destination${contentDestinationProjection}}
    }
  }
`;
