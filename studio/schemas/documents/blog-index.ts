import { Newspaper } from "lucide-react";
import { defineField, defineType } from "sanity";
import { blogIndexBlocksField } from "../blocks/page-builder";
import meta from "../blocks/shared/meta";

export default defineType({
  name: "blogIndex",
  title: "Blog Index",
  type: "document",
  icon: Newspaper,
  groups: [
    { name: "content", title: "Content" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      group: "content",
      description:
        "Used in search results and link previews. The page header is the Hero section below.",
      validation: (rule) =>
        rule
          .custom((value) =>
            value?.trim() ? true : "Add a description for search results",
          )
          .warning(),
    }),
    blogIndexBlocksField,
    meta,
  ],
  preview: {
    select: { title: "title", subtitle: "description" },
    prepare: ({ subtitle, title }) => ({
      title: title || "Untitled Blog Index",
      subtitle: subtitle || "/blog",
    }),
  },
});
