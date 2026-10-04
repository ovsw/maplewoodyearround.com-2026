import { Mountain } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { breadcrumbsField, highlightTextField } from "./shared/maplewood-fields";

/** Flatten a minimalRichText value into plain text for the Studio preview. */
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

const innerHeroFact = defineArrayMember({
  name: "innerHeroFact",
  title: "Fact",
  type: "object",
  fields: [
    defineField({
      name: "value",
      type: "string",
      description: 'The bold figure or short phrase, e.g. "160 acres".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      type: "string",
      description: "A one-line explanation shown under the value.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "value", subtitle: "label" },
  },
});

export default defineType({
  name: "innerHero",
  title: "Inner Hero",
  type: "object",
  icon: Mountain,
  description:
    "Interior page heading with an optional photo, supporting copy, buttons and facts.",
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      description:
        'Short label above the heading.',
    }),
    breadcrumbsField,
    defineField({
      name: "title",
      title: "Heading",
      type: "minimalRichText",
      description:
        "The page heading. Use italic for the one word or phrase that gets the handwritten amber style.",
      validation: (rule) => rule.required(),
    }),
    highlightTextField,
    defineField({
      name: "body",
      title: "Supporting line",
      type: "text",
      rows: 2,
      description: "One plain sentence or two under the heading.",
    }),
    defineField({
      name: "linksLabel",
      title: "Label before the links",
      type: "string",
      description: 'Optional, such as "On this page:". Shown before the link-style buttons.',
    }),
    defineField({
      name: "buttons",
      type: "array",
      description:
        'Buttons in display order. Use the "Link" style for links to sections of this page.',
      of: [defineArrayMember({ type: "button" })],
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      description:
        "Full-bleed photo behind the heading. Set the hotspot on the part that must stay visible on phones.",
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
          description: "Describe meaningful content. Leave empty for a decorative image.",
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "facts",
      title: "Facts",
      type: "array",
      description:
        "Optional. Up to four short facts along the bottom edge of the photo. Each has a bold value and a label.",
      of: [innerHeroFact],
      validation: (rule) => rule.max(4),
    }),
  ],
  preview: {
    select: { media: "image", title: "title" },
    prepare: ({ media, title }) => ({
      title: richTextToPlainText(title) || "Untitled Inner Hero",
      subtitle: "Inner Hero",
      media,
    }),
  },
});
