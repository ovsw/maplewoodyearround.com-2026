import { groq } from "next-sanity";
import { urlInternalHref } from "./shared/internal-href";

// @sanity-typegen-ignore
export const ctaBannerQuery = groq`
  _type == "ctaBanner" => {
    variant,
    title,
    description,
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
    })
  }
`;
