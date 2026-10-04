import { BookOpenText } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionBackgroundField } from "./shared/section-background";
import { sectionAnchorField, taglineField } from "./shared/maplewood-fields";

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
        { title: "Heading 2", value: "h2" },
        { title: "Heading 3", value: "h3" },
        { title: "Heading 4", value: "h4" },
        { title: "Heading 5", value: "h5" },
        { title: "Heading 6", value: "h6" },
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
    rule.custom((value: Array<{ style?: string }> | undefined) => {
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
    sectionAnchorField,
    taglineField,
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
    defineField({
      name: "imagePosition",
      title: "Image side",
      type: "string",
      description: "The side of the section that shows the image.",
      initialValue: "right",
      options: {
        layout: "radio",
        list: [
          { title: "Right", value: "right" },
          { title: "Left", value: "left" },
        ],
      },
    }),
    defineField({
      name: "headingSize",
      title: "Heading size",
      type: "string",
      initialValue: "large",
      options: {
        layout: "radio",
        list: [
          { title: "Large", value: "large" },
          { title: "Small", value: "small" },
        ],
      },
    }),
    storyRichTextField,
    defineField({
      name: "features",
      title: "Points",
      type: "array",
      description: "Optional short points with icons, shown below the text.",
      of: [defineArrayMember({ type: "featureItem" })],
      validation: (rule) => rule.max(4),
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
