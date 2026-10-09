import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { customLinkMarkDefsQuery } from "./shared/custom-link";
import { urlInternalHref } from "./shared/internal-href";
import { minimalRichTextQuery } from "./shared/minimal-rich-text";
import { simpleRichTextQuery } from "./shared/simple-rich-text";
import { iconProjection, taglineProjection } from "./shared/maplewood";

// @sanity-typegen-ignore
export const storyFeatureQuery = groq`
  _type == "storyFeature" => {
    anchorId,
    ${taglineProjection},
    imagePosition,
    videoUrl,
    videoLabel,
    headingSize,
    features[]{
      _key, ${iconProjection}, accent, title,
      body[]{${simpleRichTextQuery}}
    },
    title[]{
      ${minimalRichTextQuery}
    },
    image {
      ${imageQuery}
    },
    richText[]{
      ...,
      ${customLinkMarkDefsQuery}
    },
    buttons[]{
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
    }
  }
`;
