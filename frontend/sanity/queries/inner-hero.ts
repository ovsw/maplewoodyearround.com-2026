import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { urlInternalHref } from "./shared/internal-href";

// @sanity-typegen-ignore
export const innerHeroQuery = groq`
  _type == "innerHero" => {
    eyebrow,
    title[]{
      ...
    },
    body,
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
    },
    "facts": array::compact(facts[]{
      _key,
      value,
      label
    })
  }
`;
