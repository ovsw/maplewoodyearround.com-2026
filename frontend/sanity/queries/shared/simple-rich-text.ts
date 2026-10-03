import { groq } from "next-sanity";
import { customLinkMarkDefsQuery } from "./custom-link";

// Projection for simpleRichText fields: passes blocks through unchanged but
// resolves each customLink annotation to a concrete href, mirroring
// richTextContentQuery.
// @sanity-typegen-ignore
export const simpleRichTextQuery = groq`
  ...,
  ${customLinkMarkDefsQuery}
`;
