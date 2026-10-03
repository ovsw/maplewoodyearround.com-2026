import { GalleryVertical } from "lucide-react";
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

const slide = defineArrayMember({
  name: "largeSlidesSlide",
  title: "Slide",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Title",
      type: "string",
      description: "The name of this slide: a place, a moment, or a step.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "time",
      title: "Time",
      type: "string",
      description:
        "Optional. For a timeline, the time shown large above the title, as written, e.g. 7:15 am. Leave empty for slides that are not moments in a day.",
    }),
    defineField({
      name: "text",
      title: "One line",
      type: "string",
      description:
        "One or two sentences about this slide. Explain any camp jargon.",
      validation: (rule) => rule.required().max(260),
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      description:
        "Shown one screen tall beside the copy on desktop, so a portrait or square crop works best.",
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
      title: label || "Untitled Slide",
      subtitle: time || undefined,
      media,
    }),
  },
});

export default defineType({
  name: "largeSlides",
  title: "Large Slides",
  type: "object",
  icon: GalleryVertical,
  description:
    "A slideshow: one large photo pins beside the copy and changes as each slide scrolls into view. Works for places, moments, or steps.",
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
      name: "slides",
      type: "array",
      description: "Slides are shown in the order listed here, first to last.",
      of: [slide],
      validation: (rule) => rule.required().min(2).max(8),
    }),
  ],
  preview: {
    select: { eyebrow: "eyebrow", slides: "slides", title: "title" },
    prepare: ({ eyebrow, slides, title }) => {
      const count = Array.isArray(slides) ? slides.length : 0;
      return {
        title: richTextToPlainText(title) || eyebrow || "Large Slides",
        subtitle: `${count} ${count === 1 ? "slide" : "slides"}`,
      };
    },
  },
});
