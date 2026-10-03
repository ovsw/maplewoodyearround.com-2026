import { defineField, defineType } from "sanity";
import { Files } from "lucide-react";
import meta from "../blocks/shared/meta";
import { blocksField } from "../blocks/page-builder";
import { uniqueRoutedSlug } from "../validation/routed-slug";

export default defineType({
  name: "page",
  type: "document",
  title: "Page",
  icon: Files,
  orderings: [
    {
      title: "Title (A–Z)",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
    {
      title: "Title (Z–A)",
      name: "titleDesc",
      by: [{ field: "title", direction: "desc" }],
    },
    {
      title: "Last updated (newest)",
      name: "updatedAtDesc",
      by: [{ field: "_updatedAt", direction: "desc" }],
    },
    {
      title: "Last updated (oldest)",
      name: "updatedAtAsc",
      by: [{ field: "_updatedAt", direction: "asc" }],
    },
    {
      title: "Created (newest)",
      name: "createdAtDesc",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
    {
      title: "Created (oldest)",
      name: "createdAtAsc",
      by: [{ field: "_createdAt", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "slug.current",
    },
  },
  groups: [
    {
      name: "content",
      title: "Content",
    },
    {
      name: "seo",
      title: "SEO",
    },
    {
      name: "settings",
      title: "Settings",
    },
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
      title: "Description",
      type: "text",
      rows: 3,
      group: "content",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "settings",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().custom(uniqueRoutedSlug),
    }),
    blocksField,
    meta,
  ],
});
