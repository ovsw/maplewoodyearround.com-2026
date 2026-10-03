import { BookOpenText } from "lucide-react";
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

const storyRichTextField = defineField({
  name: "richText",
  title: "Narrative",
  type: "array",
  description: "The main story. Use Pull Quote to emphasize one important statement.",
  of: [
    defineArrayMember({
      name: "block",
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Pull Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
        ],
        annotations: [
          defineArrayMember({ type: "customLink" }),
        ],
      },
    }),
  ],
  validation: (rule) =>
    rule.required().custom((value: Array<{ style?: string }> | undefined) => {
      const pullQuotes = value?.filter((block) => block.style === "blockquote").length ?? 0;

      return pullQuotes <= 1 ? true : "Use no more than one pull quote in this story";
    }),
});

export default defineType({
  name: "storyFeature",
  title: "Image and Text",
  type: "object",
  icon: BookOpenText,
  description:
    "A reusable image-and-text section for a story, service, or point of view.",
  fields: [
    sectionBackgroundField,
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Optional short label shown above the section heading",
    }),
    defineField({
      name: "title",
      title: "Heading",
      type: "minimalRichText",
      description: "Use italic for the phrase that gets the handwritten style.",
      validation: (rule) => rule.required().max(1),
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Image",
      description:
        "The main story image. Add alt text and use the hotspot tool to preserve its focal point when cropped.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt Text",
          description: "The text that describes the image for screen readers and search engines",
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    storyRichTextField,
    defineField({
      name: "keyDetails",
      title: "Key Details",
      type: "object",
      description: "Optional short facts shown as non-interactive pills",
      fields: [
        defineField({
          name: "title",
          type: "string",
          description: "Optional label shown above the key details",
        }),
        defineField({
          name: "items",
          type: "array",
          description: "Short facts to display as pills",
          of: [defineArrayMember({ type: "string" })],
          validation: (rule) => rule.required().min(1).max(8),
        }),
      ],
    }),
    defineField({
      name: "buttons",
      title: "Buttons",
      type: "array",
      description: "Optional actions shown after the story",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.max(2),
    }),
  ],
  preview: {
    select: { title: "title", media: "image" },
    prepare: ({ title, media }) => ({
      title: richTextToPlainText(title) || "Untitled Image and Text",
      subtitle: "Image and Text",
      media,
    }),
  },
});
