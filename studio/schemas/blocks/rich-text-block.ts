import { TextIcon } from "lucide-react";
import { defineField, defineType } from "sanity";
import { sectionBackgroundField } from "./shared/section-background";
import { sectionAnchorField, taglineField } from "./shared/maplewood-fields";

export default defineType({
  name: "richTextBlock",
  title: "Rich Text Block",
  type: "object",
  icon: TextIcon,
  description: "Long-form editorial content with an optional introduction.",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    taglineField,
    defineField({
      name: "align",
      title: "Alignment",
      type: "string",
      initialValue: "left",
      options: {
        layout: "radio",
        list: [
          { title: "Left", value: "left" },
          { title: "Centre", value: "center" },
        ],
      },
    }),
    defineField({
      name: "title",
      type: "string",
      description: "Optional heading shown above the rich text content",
    }),
    defineField({
      name: "richText",
      title: "Content",
      type: "richTextContent",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Untitled Rich Text",
      subtitle: "Rich Text",
    }),
  },
});
