import { defineField, defineType } from "sanity";
import { FolderTree } from "lucide-react";

export default defineType({
  name: "faqCategory",
  title: "FAQ category",
  type: "document",
  icon: FolderTree,
  description:
    "A topic that groups FAQs on the FAQ hub. Every FAQ belongs to one category.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The topic name visitors see, for example “Getting there”.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "A short internal name. It must be different for each category.",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Categories with a lower number come first.",
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "string",
      description: "Optional. One line that says what this topic covers.",
    }),
  ],
  orderings: [
    {
      title: "Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      order: "order",
    },
    prepare: ({ title, order }) => ({
      title: title || "Untitled FAQ category",
      subtitle: typeof order === "number" ? `Order ${order}` : "No order",
    }),
  },
});
