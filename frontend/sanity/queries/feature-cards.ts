import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { urlInternalHref } from "./shared/internal-href";

// @sanity-typegen-ignore
export const featureCardsQuery = groq`
  _type == "featureCards" => {
    eyebrow,
    title[]{
      ...
    },
    description,
    "groups": array::compact(groups[]{
      _key,
      heading,
      description,
      "singleRowUpToFour": coalesce(singleRowUpToFour, true),
      "cards": array::compact(cards[]{
        _key,
        image {
          ${imageQuery}
        },
        title,
        text,
        link {
          text,
          "openInNewTab": url.openInNewTab,
          "href": select(
            url.type == "internal" => ${urlInternalHref},
            url.type == "external" => url.external,
            url.href
          )
        }
      })
    })
  }
`;
