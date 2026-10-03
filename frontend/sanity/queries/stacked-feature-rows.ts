import { groq } from "next-sanity";
import { urlInternalHref } from "./shared/internal-href";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const stackedFeatureRowsQuery = groq`
  _type == "stackedFeatureRows" => {
    eyebrow,
    title[]{
      ...
    },
    "rows": array::compact(rows[]{
      _key,
      "icon": icon{ name, svg },
      title,
      "items": array::compact(items[]{
        _key,
        body[]{
          ${simpleRichTextQuery}
        }
      }),
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
  }
`;
