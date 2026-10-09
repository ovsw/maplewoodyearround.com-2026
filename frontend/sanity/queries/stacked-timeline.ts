import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { urlInternalHref } from "./shared/internal-href";
import { minimalRichTextQuery } from "./shared/minimal-rich-text";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const stackedTimelineQuery = groq`
  _type == "stackedTimeline" => {
    anchorId,
    layout,
    eyebrow,
    title[]{
      ${minimalRichTextQuery}
    },
    intro,
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
    "items": array::compact(items[]{
      _key,
      title,
      meta,
      text,
      body[]{${simpleRichTextQuery}},
      image {
        ${imageQuery}
      }
    })
  }
`;
