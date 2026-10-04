import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import RateTableRowsInput from "../inputs/rate-table-rows-input";
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
        "The first column holds the row headings; then one column per program. Use 3 or 4 columns.",
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
      validation: (rule) =>
        rule
          .required()
          .min(3)
          .error("Use 3 or 4 columns: the row headings, then 2 or 3 programs.")
          .max(4)
          .error("Use 3 or 4 columns: the row headings, then 2 or 3 programs."),
    }),
    defineField({
      name: "rows",
      title: "Rows",
      type: "array",
      description:
        "Prices or dates in display order, one value per program column. Keep the original wording.",
      components: { input: RateTableRowsInput },
      validation: (rule) =>
        rule.custom((rows: Array<{ label?: string; cells?: string[] }> | undefined, context) => {
          const parent = context.parent as { columns?: unknown[] } | undefined;
          const width = Math.max(0, (parent?.columns?.length ?? 0) - 1);
          const problem = (rows ?? []).find(
            (row) =>
              !row.label?.trim() ||
              (row.cells?.length ?? 0) !== width ||
              row.cells?.some((cell) => !cell?.trim()),
          );
          if (!problem) return true;
          const name = problem.label?.trim() || "A row";
          if (!problem.label?.trim()) return "Every row needs a heading.";
          return `${name}: enter exactly one value for each of the ${width} program columns.`;
        }),
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
