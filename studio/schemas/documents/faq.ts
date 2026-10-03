import { defineField, defineType } from "sanity";
import { ListCollapse } from "lucide-react";

export default defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  icon: ListCollapse,
  description:
    "A reusable question and answer that can be selected in FAQ sections.",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Question",
      description: "The question shown to visitors.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Answer",
      type: "simpleRichText",
      description: "The reusable answer shown inside FAQ sections.",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "faqCategory" }],
      description: "The topic this question appears under on the FAQ hub.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description:
        "Optional. Lower numbers come first inside the category. Questions without a number come last, in A to Z order.",
      validation: (Rule) => Rule.integer(),
    }),
  ],

  preview: {
    select: {
      title: "title",
      category: "category.title",
    },
    prepare: ({ title, category }) => ({
      title: title || "Untitled FAQ",
      subtitle: category || "No category",
    }),
  },
});
