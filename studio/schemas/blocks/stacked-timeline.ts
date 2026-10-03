import { ListOrdered } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionBackgroundField } from "./shared/section-background";

const item = defineArrayMember({
  name: "stackedTimelineItem",
  title: "Card",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "The name of this step, stop, or milestone, e.g. Yorkdale.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "meta",
      title: "Small label",
      type: "string",
      description: "Optional. Shown as written beside the number, e.g. 10:00 am or 1975.",
    }),
    defineField({
      name: "text",
      title: "One line",
      type: "string",
      description:
        "One sentence on what happens here. Explain any camp jargon.",
      validation: (rule) => rule.required().max(180),
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      description:
        "Optional. Shown 16:9 above the text. Leave empty until a real photo exists.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          description: "What the photo shows, for screen readers.",
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", meta: "meta", media: "image" },
    prepare: ({ title, meta, media }) => ({
      title: title || "Untitled Card",
      subtitle: meta || undefined,
      media,
    }),
  },
});

export default defineType({
  name: "stackedTimeline",
  title: "Timeline",
  type: "object",
  icon: ListOrdered,
  description:
    "A sticky intro with up to two actions beside a stack of numbered cards, in order. Everything stacks on phones.",
  fields: [
    sectionBackgroundField,
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Optional short label shown above the heading.",
    }),
    defineField({
      name: "title",
      title: "Heading",
      type: "minimalRichText",
      description: "Use italic for the phrase that gets the handwritten style.",
      validation: (rule) => rule.required().max(1),
    }),
    defineField({
      name: "intro",
      title: "Intro line",
      type: "text",
      rows: 2,
      description: "Optional. One or two sentences under the heading.",
    }),
    defineField({
      name: "buttons",
      type: "array",
      description:
        "Optional. Up to two actions under the intro. The first is emphasized; the second renders as an outline.",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: "items",
      title: "Cards",
      type: "array",
      description: "Cards are shown in the order listed here, first to last.",
      of: [item],
      validation: (rule) => rule.required().min(2).max(8),
    }),
  ],
  preview: {
    select: { eyebrow: "eyebrow", items: "items" },
    prepare: ({ eyebrow, items }) => {
      const count = Array.isArray(items) ? items.length : 0;
      return {
        title: eyebrow || "Timeline",
        subtitle: `${count} ${count === 1 ? "card" : "cards"}`,
      };
    },
  },
});
