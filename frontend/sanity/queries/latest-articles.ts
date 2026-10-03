import { groq } from "next-sanity";
import {
  blogPostOrder,
  blogPostProjection,
  publishedPostFilter,
} from "./blog-post-listing";
import { imageQuery } from "./shared/image";
import { urlInternalHref } from "./shared/internal-href";

// @sanity-typegen-ignore
export const latestArticlesQuery = groq`
  _type == "latestArticles" => {
    eyebrow,
    title,
    description,
    limit,
    buttons[]{
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
    },
    fallbackImage {
      ${imageQuery}
    },
    "articles": *[
      ${publishedPostFilter} &&
      meta.noindex != true &&
      seoHideFromLists != true &&
      seoNoIndex != true
    ] | order(${blogPostOrder})[0...12]{
      ${blogPostProjection}
    }
  }
`;
