import { groq } from "next-sanity";
import { ROOT_SLUG_FILTER } from "../../../shared/root-slug-filter";
import { publishedPostFilter } from "./blog-post-listing";
import { imageQuery } from "./shared/image";
import { metaQuery } from "./shared/meta";
import { richTextContentQuery } from "./shared/rich-text-content";

const POST_PROJECTION = groq`{
    // richTextContent V2
    _id,
    _type,
    title,
    slug,
    publishedAt,
    "excerpt": pt::text(excerpt),
    image{
      ${imageQuery}
    },
    body[]{
      ${richTextContentQuery}
    },
    author->{
      _id,
      _type,
      name,
      image {
        ${imageQuery}
      }
    },
    category->{
      _id,
      _type,
      title,
      slug
    },
    _createdAt,
    _updatedAt,
    ${metaQuery},
}`;

export const POST_QUERY = groq`*[_type == "post" && ${ROOT_SLUG_FILTER}][0]${POST_PROJECTION}`;

export const PUBLISHED_POST_QUERY = groq`*[
  ${publishedPostFilter} && ${ROOT_SLUG_FILTER}
][0]${POST_PROJECTION}`;

export const POST_OG_IMAGE_QUERY = groq`*[
  _type == "post" && ${ROOT_SLUG_FILTER}
][0]{
  title,
  publishedAt
}`;

export const POSTS_QUERY = groq`*[_type == "post" && defined(slug)] | order(_createdAt desc){
    title,
    slug,
    publishedAt,
    "excerpt": pt::text(excerpt),
    image{
      ${imageQuery}
    },
}`;

export const POSTS_SLUGS_QUERY = groq`*[_type == "post" && defined(slug)]{slug}`;
