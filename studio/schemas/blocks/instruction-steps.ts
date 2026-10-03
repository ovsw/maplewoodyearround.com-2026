import { defineType } from "sanity";
import { sectionTitleField, sectionDescriptionField, sectionActionsField, contentCardsField } from "./shared/maplewood-fields";

export default defineType({
  name: "instructionSteps",
  title: "Instruction steps",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField, sectionDescriptionField, contentCardsField, sectionActionsField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Instruction steps", subtitle: "Instruction steps" }),
  },
});
import { sectionBackgroundField } from "./shared/section-background";
