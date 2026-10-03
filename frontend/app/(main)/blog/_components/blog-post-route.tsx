import { RootContentView } from "@/components/root-content";
import { getBlogPostSidebar } from "@/components/post-sidebar/model";
import {
  fetchBlogPostSettings,
  fetchSanityPostBySlug,
} from "@/sanity/lib/fetch";
import type { DynamicFetchOptions } from "@/sanity/lib/live";
import { notFound } from "next/navigation";

export async function BlogPostRoute({
  slug,
  perspective,
  stega,
}: { slug: string } & DynamicFetchOptions) {
  const [post, blogPostSettings] = await Promise.all([
    fetchSanityPostBySlug({ slug, perspective, stega }),
    fetchBlogPostSettings({ perspective, stega }).catch(() => null),
  ]);
  if (!post) notFound();

  return (
    <RootContentView
      blogPostSidebar={getBlogPostSidebar(blogPostSettings)}
      content={post}
      perspective={perspective}
      stega={stega}
    />
  );
}
