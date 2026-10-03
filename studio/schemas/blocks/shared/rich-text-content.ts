import { ImageIcon, MessageSquareQuoteIcon, Table2Icon } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import RichTextTableInput from "../../inputs/rich-text-table-input";

export default defineType({
  name: "richTextContent",
  title: "Rich Text Content",
  type: "array",
  of: [
    defineArrayMember({
      name: "block",
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "H2", value: "h2" },
        { title: "H3", value: "h3" },
        { title: "H4", value: "h4" },
        { title: "H5", value: "h5" },
        { title: "H6", value: "h6" },
        { title: "Quote", value: "blockquote" },
        { title: "Inline", value: "inline" },
      ],
      lists: [
        { title: "Numbered", value: "number" },
        { title: "Bullet", value: "bullet" },
      ],
      marks: {
        annotations: [
          defineArrayMember({ type: "customLink" }),
          defineArrayMember({ type: "buttonLink" }),
        ],
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
        ],
      },
    }),
    defineArrayMember({
      name: "image",
      title: "Image",
      type: "image",
      icon: ImageIcon,
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alternative Text", type: "string" }),
        defineField({ name: "caption", title: "Caption Text", type: "string" }),
      ],
    }),
    defineArrayMember({
      name: "table",
      title: "Table",
      type: "object",
      icon: Table2Icon,
      components: { input: RichTextTableInput },
      fields: [
        defineField({ name: "title", title: "Table Title", type: "string" }),
        defineField({
          name: "rows",
          title: "Rows",
          type: "array",
          of: [
            defineArrayMember({
              name: "tableRow",
              title: "Table Row",
              type: "object",
              fields: [
                defineField({
                  name: "cells",
                  title: "Cells",
                  type: "array",
                  of: [defineArrayMember({ type: "string" })],
                }),
              ],
            }),
          ],
        }),
      ],
      preview: {
        select: { title: "title" },
        prepare: ({ title }) => ({ title: title || "Table" }),
      },
    }),
    defineArrayMember({
      name: "callout",
      title: "Callout",
      type: "object",
      icon: MessageSquareQuoteIcon,
      fields: [
        defineField({ name: "title", title: "Title", type: "string" }),
        defineField({
          name: "body",
          title: "Body",
          type: "text",
          rows: 3,
          validation: (rule) => rule.required(),
        }),
      ],
      preview: {
        select: { title: "title", subtitle: "body" },
        prepare: ({ subtitle, title }) => ({
          title: title || "Callout",
          subtitle,
        }),
      },
    }),
  ],
});
