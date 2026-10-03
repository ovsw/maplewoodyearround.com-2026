import { defineType } from "sanity";
import { sectionTitleField, sectionDescriptionField, sectionActionsField, contentCardsField } from "./shared/maplewood-fields";

export default defineType({
  name: "electiveCards",
  title: "Elective cards",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField, sectionDescriptionField, contentCardsField, sectionActionsField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Elective cards", subtitle: "Elective cards" }),
  },
});
import { sectionBackgroundField } from "./shared/section-background";
