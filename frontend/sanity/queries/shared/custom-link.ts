import { groq } from "next-sanity";
import { customLinkInternalHref } from "./internal-href";

// @sanity-typegen-ignore
export const customLinkProjection = groq`
  "href": select(
    customLink.type == "internal" => ${customLinkInternalHref},
    customLink.type == "external" => customLink.external,
    customLink.type == "file" => coalesce(customLink.file.asset->url + "/" + customLink.file.asset->originalFilename, customLink.file.asset->url),
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
