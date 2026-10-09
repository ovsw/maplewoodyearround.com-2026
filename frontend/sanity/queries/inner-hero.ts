import { groq } from "next-sanity";
import { contentDestinationProjection, sectionVideoProjection } from "./shared/maplewood";
import { imageQuery } from "./shared/image";
import { urlInternalHref } from "./shared/internal-href";
import { urlFileUrl } from "./shared/file-url";

// @sanity-typegen-ignore
export const innerHeroQuery = groq`
  _type == "innerHero" => {
    eyebrow,
    "breadcrumbs": array::compact(breadcrumbs[]{
      _key, label, program, destination${contentDestinationProjection}
    }),
    linksLabel,
    highlightText,
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
        url.type == "file" => ${urlFileUrl},
        url.href
      )
    }),
    image {
      ${imageQuery}
    },
    ${sectionVideoProjection},
    "facts": array::compact(facts[]{
      _key,
      value,
      label
    })
  }
`;
