import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import {
  sectionTitleField,
  sectionActionsField,
  sectionAnchorField,
  taglineField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "rateTable",
  title: "Rate or session table",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    taglineField,
    sectionTitleField,
    defineField({
      name: "intro",
      title: "Introduction",
      type: "richTextContent",
      description: "Who the table is for, times and other notes above it.",
    }),
    defineField({
      name: "columns",
      title: "Columns",
      type: "array",
      description:
        "One entry for each column, in order. The first column holds the row headings.",
      of: [
        {
          name: "rateColumn",
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Heading",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "note",
              title: "Small note",
              type: "string",
              description: 'Shown under the heading, such as "(preschool only)".',
            }),
            defineField({
              name: "detail",
              title: "Detail",
              type: "string",
              description: 'Such as "Tuesday & Thursday".',
            }),
            defineField({
              name: "image",
              title: "Image",
              type: "image",
              options: { hotspot: true },
              fields: [
                defineField({
                  name: "alt",
                  title: "Image description",
                  type: "string",
                }),
              ],
            }),
          ],
          preview: { select: { title: "label", media: "image" } },
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "rows",
      title: "Rows",
      type: "array",
      description:
        "Prices or dates in display order. Keep the original wording.",
      of: [
        {
          name: "rateRow",
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Row heading",
              type: "string",
              description: "The program or period for this row.",
            }),
            defineField({
              name: "cells",
              title: "Values",
              type: "array",
              description: "One value per column, in the same order.",
              of: [{ type: "string" }],
            }),
          ],
          preview: { select: { title: "label" } },
        },
      ],
    }),
    defineField({
      name: "notes",
      title: "Text below the table",
      type: "richTextContent",
      description: "Shown large above the buttons, such as a reminder to reserve.",
    }),
    sectionActionsField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Rate or session table",
      subtitle: "Rate or session table",
    }),
  },
});
