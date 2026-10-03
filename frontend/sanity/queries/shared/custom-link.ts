import { groq } from "next-sanity";
import { customLinkInternalHref } from "./internal-href";

// @sanity-typegen-ignore
export const customLinkProjection = groq`
  "href": select(
    customLink.type == "internal" => ${customLinkInternalHref},
    customLink.type == "external" => customLink.external,
    customLink.href
  ),
  "openInNewTab": customLink.openInNewTab
`;

// @sanity-typegen-ignore
export const customLinkMarkDefsQuery = groq`
  markDefs[]{
    ...,
    _type == "customLink" => {
      ${customLinkProjection}
    }
  }
`;
