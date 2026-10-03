import { Newspaper } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionBackgroundField } from "./shared/section-background";

export default defineType({
  name: "latestArticles",
  title: "Latest Posts",
  type: "object",
  icon: Newspaper,
  description:
    "Lists the newest published Blog Posts. On the Blog page it lists every post with pagination.",
  fields: [
    sectionBackgroundField,
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Optional short label shown before the section title.",
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The main heading for the latest posts section.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      description: "Optional supporting copy.",
    }),
    defineField({
      name: "limit",
      title: "Number of posts",
      type: "number",
      description: "How many of the newest posts to show (1 to 12).",
      initialValue: 3,
      // The Blog page lists every post with pagination instead.
      hidden: ({ document }) => document?._type === "blogIndex",
      validation: (rule) => rule.integer().min(1).max(12),
    }),
    defineField({
      name: "buttons",
      type: "array",
      description:
        "Optional link shown beside the section heading, for example to the Blog page.",
      of: [defineArrayMember({ type: "button" })],
      hidden: ({ document }) => document?._type === "blogIndex",
      validation: (rule) => rule.max(1),
    }),
    defineField({
      name: "fallbackImage",
      title: "Fallback Image",
      type: "image",
      description: "Optional image shown when a post has no image.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative Text",
          type: "string",
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", media: "fallbackImage" },
    prepare: ({ title, media }) => ({
      title: title || "Latest Posts",
      subtitle: "Latest Posts",
      media,
    }),
  },
});
