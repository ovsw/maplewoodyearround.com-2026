import { groq } from "next-sanity";
import { type BLOG_INDEX_QUERY_RESULT } from "@/sanity.types";
import { blogPostOrder, publishedPostFilter } from "./blog-post-listing";
import { imageQuery } from "./shared/image";
import { metaQuery } from "./shared/meta";

export type CategoryArchive = {
  _id: string;
  _type: "category";
  description?: string | null;
  meta?: NonNullable<BLOG_INDEX_QUERY_RESULT>["meta"];
  publishedPostCount: number;
  slug?: { current?: string | null } | null;
  title?: string | null;
};

export type CategoryStaticParam = {
  publishedPostCount: number;
  slug: string;
};

const categoryPostProjection = `
  _id,
  title,
  slug,
  publishedAt,
  "excerpt": pt::text(excerpt),
  image {${imageQuery}},
  category->{_id, title, slug}
`;

export const CATEGORY_QUERY = groq`
  *[_type == "category" && slug.current == $slug][0]{
    _id,
    _type,
    title,
    slug,
    description,
    ${metaQuery},
    "publishedPostCount": count(*[${publishedPostFilter} && category._ref == ^._id])
  }
`;

export const CATEGORY_POSTS_QUERY = groq`
  *[${publishedPostFilter} && category._ref == $categoryId]
    | order(${blogPostOrder})[$start...$end]{
      ${categoryPostProjection}
    }
`;

export const CATEGORY_POSTS_COUNT_QUERY = groq`
  count(*[${publishedPostFilter} && category._ref == $categoryId])
`;

export const CATEGORY_STATIC_PARAMS_QUERY = groq`
  *[
    _type == "category"
    && defined(slug.current)
  ]{
    "slug": slug.current,
    "publishedPostCount": count(*[${publishedPostFilter} && category._ref == ^._id])
  }
`;
