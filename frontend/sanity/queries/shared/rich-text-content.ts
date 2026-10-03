import { groq } from "next-sanity";
import { customLinkProjection } from "./custom-link";

// @sanity-typegen-ignore
export const richTextContentQuery = groq`
  ...,
  _type == "block" => {
    ...,
    children[]{...},
    markDefs[]{
      ...,
      _type in ["customLink", "buttonLink"] => {
        ${customLinkProjection}
      }
    }
  },
  _type == "image" => {
    ...,
    "resolvedAsset": asset->{
      _id,
      url,
      mimeType,
      metadata {
        lqip,
        dimensions {
          width,
          height
        }
      }
    }
  },
  _type == "table" => {
    ...,
    rows[]{
      ...,
      cells[]
    }
  },
  _type == "callout" => {
    ...,
    title,
    body
  }
`;
