import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "summerDocumentList",
  title: "Summer document list",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField,
    sectionDescriptionField,
    defineField({
      name: "kind",
      title: "Document kind",
      type: "string",
      description:
        "Show the Group schedule or the Welcome letter of every visible Camp group, by grade.",
      options: {
        list: [
          { title: "Group schedules", value: "schedule" },
          { title: "Welcome letters", value: "welcomeLetter" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Summer document list",
      subtitle: "Summer document list",
    }),
  },
});
