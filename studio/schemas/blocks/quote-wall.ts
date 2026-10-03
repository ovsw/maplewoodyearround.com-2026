import { LayoutGrid } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
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
    "Every selected Testimonial as a card in a wall of columns, for pages that are about the quotes. Long quotes are shortened with a link to read the whole quote. After the first nine cards a button shows more.",
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
    defineField({
      name: "testimonials",
      title: "Testimonials",
      type: "array",
      description:
        "The quotes to show. Cards fill the columns in this order, top to bottom, then left to right.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "testimonial" }],
        }),
      ],
      validation: (rule) => [
        rule.required().min(1).error("Add at least one testimonial to this section."),
        rule.unique().error("Each testimonial can be listed only once in this section."),
      ],
    }),
  ],
  preview: {
    select: { eyebrow: "eyebrow", heading: "heading", testimonials: "testimonials" },
    prepare: ({ eyebrow, heading, testimonials }) => {
      const count = Array.isArray(testimonials) ? testimonials.length : 0;
      return {
        title: richTextToPlainText(heading) || eyebrow || "Quote wall",
        subtitle: `Quote wall · ${count} ${count === 1 ? "quote" : "quotes"}`,
      };
    },
  },
});
