import { defineType } from "sanity";
import { sectionTitleField, sectionDescriptionField, sectionActionsField, contentCardsField, embedUrlField } from "./shared/maplewood-fields";

export default defineType({
  name: "busMap",
  title: "Bus map and benefits",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField, sectionDescriptionField, embedUrlField, contentCardsField, sectionActionsField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Bus map and benefits", subtitle: "Bus map and benefits" }),
  },
});
import { sectionBackgroundField } from "./shared/section-background";
