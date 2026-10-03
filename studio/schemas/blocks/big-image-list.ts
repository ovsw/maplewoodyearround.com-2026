import { Clock } from "lucide-react";
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

const stop = defineArrayMember({
  name: "bigImageListStop",
  title: "Stop",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "What happens",
      type: "string",
      description: "What happens at this point in the list.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "time",
      title: "Time",
      type: "string",
      description: "Shown as written, e.g. 7:15 am.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "text",
      title: "One line",
      type: "string",
      description:
        "One sentence on what happens here and who is with the camper. Explain any camp jargon.",
      validation: (rule) => rule.required().max(180),
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      description: "A photo for this row.",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
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
    select: { label: "label", time: "time", media: "image" },
    prepare: ({ label, time, media }) => ({
      title: label || "Untitled Stop",
      subtitle: time || undefined,
      media,
    }),
  },
});

export default defineType({
  name: "bigImageList",
  title: "Big Image List",
  type: "object",
  icon: Clock,
  description: "An ordered list with large times and photos beside each story.",
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
      name: "stops",
      type: "array",
      description: "Stops are shown in the order listed here, first to last.",
      of: [stop],
      validation: (rule) => rule.required().min(2).max(8),
    }),
  ],
  preview: {
    select: { eyebrow: "eyebrow", stops: "stops", title: "title" },
    prepare: ({ eyebrow, stops, title }) => {
      const count = Array.isArray(stops) ? stops.length : 0;
      return {
        title: richTextToPlainText(title) || eyebrow || "Big Image List",
        subtitle: `${count} ${count === 1 ? "stop" : "stops"}`,
      };
    },
  },
});
