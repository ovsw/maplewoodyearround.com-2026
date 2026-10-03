import { LayoutTemplate } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

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

export default defineType({
  name: "hero",
  title: "Page Header",
  type: "object",
  icon: LayoutTemplate,
  description:
    "The opening section of an interior page: forest gradient, big heading with a handwritten accent, optional supporting copy, actions, and photo.",
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      description:
        'Short amber label above the heading, e.g. "Adventure Island · Since 1975".',
    }),
    defineField({
      name: "title",
      title: "Heading",
      type: "minimalRichText",
      description:
        "The page heading. Use italic for the word or phrase that gets the handwritten amber style.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Supporting message",
      type: "simpleRichText",
    }),
    defineField({
      name: "buttons",
      type: "array",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      description:
        "Optional. Blends into the right side of the gradient behind the heading; without it the header uses the forest glow alone.",
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
          validation: (rule) =>
            rule.custom((value, context) => {
              const image = context.parent as { asset?: unknown } | undefined;
              return image?.asset && !value
                ? "Describe the image for visitors who cannot see it"
                : true;
            }),
        }),
      ],
    }),
  ],
  preview: {
    select: { media: "image", title: "title" },
    prepare: ({ media, title }) => ({
      title: richTextToPlainText(title) || "Untitled Page Header",
      subtitle: "Page Header",
      media,
    }),
  },
});
