import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { iconProjection } from "./shared/maplewood";
import { simpleRichTextQuery } from "./shared/simple-rich-text";
import { urlInternalHref } from "./shared/internal-href";

// @sanity-typegen-ignore
export const ctaBannerQuery = groq`
  _type == "ctaBanner" => {
    anchorId,
    variant,
    title,
    description,
    body[]{${simpleRichTextQuery}},
    ${iconProjection}, accent,
    image{${imageQuery}},
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
    })
  }
`;
