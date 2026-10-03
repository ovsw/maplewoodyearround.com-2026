import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
  sectionActionsField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "rateTable",
  title: "Rate or session table",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField,
    sectionDescriptionField,
    defineField({
      name: "columns",
      title: "Column headings",
      type: "array",
      description: "Heading text for each column, in order.",
      of: [{ type: "string" }],
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
      title: "Notes",
      type: "richTextContent",
      description: "Payment terms or explanations below the table.",
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
