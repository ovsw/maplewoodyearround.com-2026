import { ImageIcon } from "lucide-react";
import { defineField, defineType } from "sanity";
import { sectionBackgroundField } from "./shared/section-background";

export default defineType({
  name: "headingImage",
  title: "Heading and Image",
  type: "object",
  icon: ImageIcon,
  description: "A centred heading and rich-text paragraph above one full-width image.",
  fields: [
    sectionBackgroundField,
    defineField({
      name: "title",
      title: "Heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "richText",
      title: "Paragraph",
      type: "minimalRichText",
      description: "Optional text between the heading and image. Supports bold and italic.",
      validation: (rule) => rule.max(1),
    }),
    defineField({
      name: "image",
      type: "image",
      description: "Use crop to set the visible area and hotspot to mark the focus.",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          description: "Describe the photo for visitors who cannot see it.",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", media: "image" },
    prepare: ({ title, media }) => ({
      title: title || "Untitled Heading and Image",
      subtitle: "Heading and Image",
      media,
    }),
  },
});
