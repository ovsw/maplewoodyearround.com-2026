import { groq } from "next-sanity";
import { pageBuilderQuery } from "./page-builder";
import { metaQuery } from "./shared/meta";
import type { LATEST_POST_QUERY_RESULT } from "@/sanity.types";
import {
  blogPostOrder,
  blogPostProjection,
  publishedPostFilter,
} from "./blog-post-listing";

export type CategoryReference = {
  _id: string;
  title?: string | null;
  slug?: { current?: string | null } | null;
};

export type BlogPost = Omit<NonNullable<LATEST_POST_QUERY_RESULT>, "category"> & {
  category?: CategoryReference | null;
};

export const BLOG_INDEX_QUERY = groq`
  *[_id == "blogIndex"][0]{
    _id,
    _type,
    title,
    description,
    ${pageBuilderQuery},
    ${metaQuery}
  }
`;

export const LATEST_POST_QUERY = groq`
  *[${publishedPostFilter}] | order(${blogPostOrder})[0]{
    ${blogPostProjection}
  }
`;

export const REGULAR_POSTS_QUERY = groq`
  *[${publishedPostFilter} && _id != $latestPostId]
    | order(${blogPostOrder})[$start...$end]{
      ${blogPostProjection}
    }
`;

export const REGULAR_POSTS_COUNT_QUERY = groq`
  count(*[${publishedPostFilter} && _id != $latestPostId])
`;

export const ELIGIBLE_BLOG_POSTS_COUNT_QUERY = groq`
  count(*[${publishedPostFilter}])
`;

export const BLOG_CATEGORY_POST_COUNTS_QUERY = groq`
  *[_type == "category" && defined(slug.current)]{
    "slug": slug.current,
    "postCount": count(*[${publishedPostFilter} && category._ref == ^._id])
  }
`;
