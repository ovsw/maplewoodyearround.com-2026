import { LayoutGrid } from "lucide-react";
import { defineField, defineType } from "sanity";
import { programOptions } from "../documents/maplewood-fields";
import { programFilterField, sectionAnchorField } from "./shared/maplewood-fields";
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
  name: "quoteWall",
  title: "Quote wall",
  type: "object",
  icon: LayoutGrid,
  description:
    "Every matching Testimonial as a card in a wall of columns, for pages that are about the quotes. Long quotes are shortened with a link to read the whole quote. After the first nine cards a button shows more.",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    defineField({
      name: "backgroundImage",
      title: "Background image",
      type: "image",
      options: { hotspot: true },
      description: "Decorative photo behind the testimonials.",
    }),
    defineField({
      name: "selectedTestimonials",
      title: "Selected testimonials",
      type: "array",
      description:
        "Optional selection in display order. Selected testimonials show even when their Visible switch is off. Leave empty to use the program filter.",
      of: [{ type: "reference", to: [{ type: "testimonial" }] }],
    }),
    defineField({
      name: "description",
      title: "Supporting text",
      type: "text",
      description:
        "The source introduction and closing text shown with these testimonials.",
    }),
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      description: "Short label shown in yellow on the heading's first line.",
    }),
    defineField({
      name: "eyebrowProgram",
      title: "Eyebrow badge colour",
      type: "string",
      description: "Optional. Show the eyebrow as a program badge instead of yellow text.",
      options: { list: programOptions },
    }),
    defineField({
      name: "subtitle",
      title: "Introduction",
      type: "text",
      rows: 2,
      description: "Optional line under the heading.",
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "minimalRichText",
      description: "Use italic for the phrase that gets the handwritten style.",
      validation: (rule) => rule.required().max(1),
    }),
    programFilterField,
  ],
  preview: {
    select: { eyebrow: "eyebrow", heading: "heading" },
    prepare: ({ eyebrow, heading }) => {
      return {
        title: richTextToPlainText(heading) || eyebrow || "Quote wall",
        subtitle: "Testimonials by program",
      };
    },
  },
});
