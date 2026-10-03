import { defineQuery } from "next-sanity";
import { imageQuery } from "./shared/image";

export const SETTINGS_QUERY = defineQuery(`
  *[_type == "settings" && _id == "settings"][0]{
    _id,
    _type,
    siteName,
    logo{
      light{
        ${imageQuery}
      },
      dark{
        ${imageQuery}
      }
    },
    contact{
      email,
      phone,
      addressLines
    },
    socialLinks[]{
      _key,
      label,
      url
    }
  }
`);

// Site-wide search and sharing defaults. Metadata and the generated-card
// failure path read this from the published perspective.
export const SEO_SETTINGS_QUERY = defineQuery(`
  *[_type == "settings" && _id == "settings"][0]{
    seoDescription,
    seoImage{
      ${imageQuery}
    }
  }
`);
