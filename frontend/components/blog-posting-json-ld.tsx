import {
  createBlogPostingJsonLd,
  serializeBlogPostingJsonLd,
  type BlogPostingJsonLdPost,
} from "@/lib/blog-posting-json-ld";

export default function BlogPostingJsonLd({
  post,
  siteUrl,
}: {
  post: BlogPostingJsonLdPost;
  siteUrl: string;
}) {
  const value = createBlogPostingJsonLd(post, siteUrl);
  if (!value) return null;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeBlogPostingJsonLd(value) }}
      type="application/ld+json"
    />
  );
}
