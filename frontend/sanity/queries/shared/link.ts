import { legacyInternalLinkHref } from "./internal-href";

export const linkQuery = `
    _key,
    ...,
    "href": select(
      isExternal => href,
      defined(href) && !defined(internalLink) => href,
      ${legacyInternalLinkHref}
    )
`;
