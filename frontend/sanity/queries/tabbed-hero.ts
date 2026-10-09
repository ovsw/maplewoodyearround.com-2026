import { groq } from "next-sanity";
import { contentDestinationProjection } from "./shared/maplewood";
import { imageQuery } from "./shared/image";
import { urlInternalHref } from "./shared/internal-href";

// @sanity-typegen-ignore
export const tabbedHeroQuery = groq`
  _type == "tabbedHero" => {
    anchorId,
    "breadcrumbs": array::compact(breadcrumbs[]{
      _key, label, program, destination${contentDestinationProjection}
    }),
    "tabs": array::compact(tabs[]{
      _key, label, title, highlightText, description,
      "buttons": array::compact(buttons[]{
        _key,
        _type,
        text,
        variant,
        "openInNewTab": url.openInNewTab,
        "href": select(
          url.type == "internal" => ${urlInternalHref},
          url.type == "external" => url.external,
          url.type == "file" => coalesce(url.file.asset->url + "/" + url.file.asset->originalFilename, url.file.asset->url),
          url.href
        )
      }),
      image{${imageQuery}}
    })
  }
`;
