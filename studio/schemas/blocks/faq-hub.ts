import { LibraryBig } from "lucide-react";
import { defineField, defineType } from "sanity";
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

/*
 * FAQ hub: every published FAQ, grouped under its category, with a search
 * field and a category filter. The section holds no FAQ list of its own; it
 * reads the whole FAQ document type at query time, so a new FAQ appears here
 * as soon as it is published with a category.
 */
export default defineType({
  name: "faqHub",
  title: "FAQ hub",
  type: "object",
  icon: LibraryBig,
  description:
    "Every published question, grouped by category, with search and a category filter. Add FAQs and categories under FAQs in the menu; this section lists them all.",
  initialValue: {
    background: "cream",
    eyebrow: "Frequently asked questions",
    searchPlaceholder: "Search every question",
    emptyState: "No question matches that search yet.",
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
    defineField({
      name: "searchPlaceholder",
      type: "string",
      title: "Search placeholder",
      description: "The grey hint inside the empty search field.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "emptyState",
      type: "text",
      rows: 2,
      title: "Empty result line",
      description:
        "Shown when no question matches the search. The office phone number is added under it.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: richTextToPlainText(title) || "Untitled FAQ hub",
      subtitle: "FAQ hub · every published question",
    }),
  },
});
