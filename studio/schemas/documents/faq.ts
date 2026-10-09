import { defineField, defineType } from "sanity";
import { ListCollapse } from "lucide-react";
import { programField, referencesField, slugField } from "./maplewood-fields";

export default defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  icon: ListCollapse,
  description:
    "A reusable question and answer that can be selected in FAQ sections.",
  fields: [
    slugField,
    programField,
    referencesField(
      "categories",
      "Categories",
      "faqCategory",
      "Every topic this question appears under. Select all that apply.",
    ),
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
      type: "richTextContent",
      description: "The reusable answer shown inside FAQ sections.",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "faqCategory" }],
      description: "The topic this question appears under on the FAQ hub.",
      hidden: true,
      readOnly: true,
      deprecated: {
        reason: "Use Categories. The importer keeps every source category.",
      },
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
      categories: "categories",
      category0: "categories.0.title",
      category1: "categories.1.title",
      category2: "categories.2.title",
    },
    prepare: ({ title, categories, category0, category1, category2 }) => {
      const names = [category0, category1, category2].filter(Boolean);
      const more = (categories?.length ?? 0) - 3;
      return {
        title: title || "Untitled FAQ",
        subtitle: names.length
          ? `${names.join(", ")}${more > 0 ? ` +${more}` : ""}`
          : "No category",
      };
    },
  },
});
