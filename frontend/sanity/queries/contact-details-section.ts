import { groq } from "next-sanity";
import { iconProjection } from "./shared/maplewood";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const contactDetailsSectionQuery = groq`
  _type == "contactDetailsSection" => {
    features[]{
      _key, ${iconProjection}, accent, title,
      body[]{${simpleRichTextQuery}}
    }
  }
`;
