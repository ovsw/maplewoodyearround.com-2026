import { defineQuery } from "next-sanity";

// Extension is explicit: next.config.mjs imports this module, and Node resolves
// those specifiers literally rather than through TypeScript's resolver.
import { redirectDestinationPath } from "./shared/redirect-destination.ts";

export const REDIRECTS_QUERY = defineQuery(/* groq */ `
  *[
    _type == "redirect" &&
    !(_id in path("drafts.**")) &&
    status == "active" &&
    defined(source.current) &&
    (defined(destinationReference._ref) || defined(destination.current))
  ] | order(source.current asc) {
    _id,
    status,
    source,
    "destination": select(
      defined(destinationReference._ref) => ${redirectDestinationPath},
      destination.current
    ),
    permanent
  }
`);
