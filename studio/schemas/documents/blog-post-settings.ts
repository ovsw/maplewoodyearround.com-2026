import { PanelRight } from "lucide-react";
import { defineType } from "sanity";
import { blogPostSidebarFields } from "../blocks/shared/blog-post-sidebar";

export default defineType({
  name: "blogPostSettings",
  title: "Blog Post Settings",
  type: "document",
  icon: PanelRight,
  description: "Shared sidebar content shown on blog post pages.",
  fields: blogPostSidebarFields,
  preview: {
    prepare: () => ({ title: "Blog Post Settings" }),
  },
});
