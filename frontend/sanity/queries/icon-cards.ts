import { groq } from "next-sanity";
import { contentDestinationProjection, iconProjection, taglineProjection } from "./shared/maplewood";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const iconCardsQuery = groq`
  _type == "iconCards" => {
    anchorId,
    "breadcrumbs": array::compact(breadcrumbs[]{
      _key, label, program, destination${contentDestinationProjection}
    }),
    ${taglineProjection},
    title,
    intro[]{${simpleRichTextQuery}},
    cards[]{
      _key, ${iconProjection}, accent, title, label,
      body[]{${simpleRichTextQuery}},
      link{label, destination${contentDestinationProjection}}
    }
  }
`;
