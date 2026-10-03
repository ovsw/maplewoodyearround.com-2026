import { groq } from "next-sanity";
import { bodyQuery } from "./shared/body";
import { imageQuery } from "./shared/image";
import { urlInternalHref } from "./shared/internal-href";

// @sanity-typegen-ignore
export const heroQuery = groq`
  _type == "hero" => {
    eyebrow,
    title[]{
      ...
    },
    body[]{
      ${bodyQuery}
    },
    "buttons": array::compact(buttons[]{
      _key,
      _type,
      text,
      variant,
      "openInNewTab": url.openInNewTab,
      "href": select(
        url.type == "internal" => ${urlInternalHref},
        url.type == "external" => url.external,
        url.href
      )
    }),
    image {
      ${imageQuery}
    }
  }
`;
