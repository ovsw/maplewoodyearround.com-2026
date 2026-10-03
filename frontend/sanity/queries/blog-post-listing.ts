import { imageQuery } from "./shared/image";

export const publishedPostFilter =
  `_type == "post" && defined(slug.current) && defined(publishedAt)`;

export const blogPostOrder = `publishedAt desc, _createdAt desc, _id asc`;

/** One post card's fields, shared by the Blog page and Latest Posts sections. */
export const blogPostProjection = `
  _id,
  title,
  slug,
  publishedAt,
  "excerpt": pt::text(excerpt),
  image {${imageQuery}},
  category->{_id, title, slug}
`;
