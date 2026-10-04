import { MessageCircle } from "lucide-react";
import { defineField, defineType } from "sanity";
import { programFilterField } from "./shared/maplewood-fields";
import { sectionBackgroundField } from "./shared/section-background";

const richTextToPlainText = (value: unknown): string => {
  if (!Array.isArray(value)) return "";
  return value
    .map((block) => {
      const children = (block as { children?: { text?: string }[] })?.children;
      if (!Array.isArray(children)) return "";
      return children.map((child) => child?.text ?? "").join("");
    })
    .join(" ")
    .trim();
};

export default defineType({
  name: "faqAccordion",
  title: "FAQ Section",
  type: "object",
  icon: MessageCircle,
  description: "Intro beside an accordion of selected FAQ documents.",
  initialValue: {
    background: "cream",
    eyebrow: "FAQ",
    subtitle: "Replace this sample with the questions visitors ask most often.",
  },
  fields: [
    sectionBackgroundField,
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Optional short label above the heading.",
    }),
    defineField({
      name: "title",
      title: "Heading",
      type: "minimalRichText",
      description: "Use italic for the phrase that gets the handwritten style.",
      validation: (rule) => rule.required().max(1),
    }),
    defineField({
      name: "subtitle",
      type: "text",
      rows: 2,
      title: "Intro line",
      description: "Optional. One or two sentences under the heading.",
    }),
    programFilterField,
    defineField({
      name: "category",
      title: "Category filter",
      type: "reference",
      to: [{ type: "faqCategory" }],
      description:
        "Show all questions in this category. Leave empty for all categories.",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => {
      return {
        title: richTextToPlainText(title) || "Untitled FAQ Section",
        subtitle: "FAQ Section",
      };
    },
  },
});
