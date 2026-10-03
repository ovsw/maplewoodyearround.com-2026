import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { urlInternalHref } from "./shared/internal-href";

// @sanity-typegen-ignore
export const imageCollageFeatureQuery = groq`
  _type == "imageCollageFeature" => {
    eyebrow,
    title[]{
      ...
    },
    body,
    "points": array::compact(points[]{
      _key,
      title,
      body
    }),
    primaryImage {
      ${imageQuery}
    },
    secondaryImage {
      ${imageQuery}
    },
    cta {
      text,
      "openInNewTab": url.openInNewTab,
      "href": select(
        url.type == "internal" => ${urlInternalHref},
        url.type == "external" => url.external,
        url.href
      )
    }
  }
`;
