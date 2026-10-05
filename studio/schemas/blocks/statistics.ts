import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import {
  accentField,
  programFilterField,
  sectionActionsField,
  sectionAnchorField,
  sectionTitleField,
  sectionDescriptionField,
  taglineField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "statistics",
  title: "Statistics",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    taglineField,
    sectionTitleField,
    sectionDescriptionField,
    defineField({
      name: "text",
      title: "Text",
      type: "simpleRichText",
      description: "Paragraphs beside the statistics.",
    }),
    defineField({
      name: "items",
      title: "Statistics",
      type: "array",
      description:
        "Statistics in display order, using the same values as the public source.",
      of: [
        {
          name: "statistic",
          type: "object",
          fields: [
            defineField({
              name: "value",
              title: "Value",
              type: "string",
              description:
                "The displayed number or phrase, including any unit.",
            }),
            defineField({
              name: "label",
              title: "Meaning",
              type: "string",
              description: "What this value measures.",
            }),
            defineField({
              name: "text",
              title: "Text",
              type: "simpleRichText",
              description: "Optional sentence under the meaning.",
            }),
            accentField,
          ],
          preview: { select: { title: "value", subtitle: "label" } },
        },
      ],
    }),
    sectionActionsField,
    {
      ...programFilterField,
      title: "Staff program",
      description: "With the switch below: the program whose preschool teachers are shown.",
    },
    defineField({
      name: "preschoolTeachers",
      title: "Show preschool teachers",
      type: "boolean",
      description: "Show the visible preschool teachers below the statistics.",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Statistics",
      subtitle: "Statistics",
    }),
  },
});
