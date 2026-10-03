import { defineField, defineType } from "sanity";
import { sectionTitleField, sectionDescriptionField } from "./shared/maplewood-fields";

export default defineType({
  name: "statistics",
  title: "Statistics",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField, sectionDescriptionField,
    defineField({ name: "items", title: "Statistics", type: "array", description: "Statistics in display order, using the same values as the public source.", of: [{ name: "statistic", type: "object", fields: [
      defineField({ name: "value", title: "Value", type: "string", description: "The displayed number or phrase, including any unit." }),
      defineField({ name: "label", title: "Meaning", type: "string", description: "What this value measures." }),
    ], preview: { select: { title: "value", subtitle: "label" } } }] }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Statistics", subtitle: "Statistics" }),
  },
});
import { sectionBackgroundField } from "./shared/section-background";
