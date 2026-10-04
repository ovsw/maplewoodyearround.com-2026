import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
  sectionActionsField,
  contentCardsField,
} from "./shared/maplewood-fields";
import { imageField } from "../documents/maplewood-fields";

export default defineType({
  name: "historyStory",
  title: "History story",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField,
    sectionDescriptionField,
    imageField(),
    defineField({
      name: "body",
      title: "Story",
      type: "richTextContent",
      description: "The story text beside the historical image.",
    }),
    contentCardsField,
    sectionActionsField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "History story",
      subtitle: "History story",
    }),
  },
});
