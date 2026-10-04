import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionBackgroundField } from "./shared/section-background";
import {
  breadcrumbsField,
  highlightTextField,
  sectionAnchorField,
} from "./shared/maplewood-fields";

const heroTab = defineArrayMember({
  name: "heroTab",
  title: "Tab",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Tab name",
      type: "string",
      description: 'The text on the tab button, such as "Preschool".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    highlightTextField,
    defineField({
      name: "description",
      title: "Text",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "buttons",
      title: "Buttons",
      type: "array",
      description: "A button without a destination is hidden.",
      of: [defineArrayMember({ type: "button" })],
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      description: "Full-width photo behind this tab.",
      fields: [
        defineField({
          name: "alt",
          title: "Image description",
          type: "string",
          description: "Describe meaningful content. Leave empty for decoration.",
        }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "title", media: "image" },
  },
});

export default defineType({
  name: "tabbedHero",
  title: "Tabbed image hero",
  type: "object",
  description:
    "Page header with one photo, heading and buttons per tab. The tabs change every 6 seconds until a visitor chooses one.",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    {
      ...breadcrumbsField,
      description: "The trail of links above the first tab's heading, in order.",
    },
    defineField({
      name: "tabs",
      title: "Tabs",
      type: "array",
      description: "Tabs in display order. The first tab shows when the page opens.",
      of: [heroTab],
      validation: (rule) => rule.min(1).max(6),
    }),
  ],
  preview: {
    select: { title: "tabs.0.title", media: "tabs.0.image" },
    prepare: ({ title, media }) => ({
      title: title || "Untitled Tabbed image hero",
      subtitle: "Tabbed image hero",
      media,
    }),
  },
});
