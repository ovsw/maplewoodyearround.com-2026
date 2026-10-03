import { LayoutGrid } from "lucide-react";
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
  name: "quoteWall",
  title: "Quote wall",
  type: "object",
  icon: LayoutGrid,
  description:
    "Every matching Testimonial as a card in a wall of columns, for pages that are about the quotes. Long quotes are shortened with a link to read the whole quote. After the first nine cards a button shows more.",
  fields: [
    sectionBackgroundField,
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      description: "Short label shown above the heading.",
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
