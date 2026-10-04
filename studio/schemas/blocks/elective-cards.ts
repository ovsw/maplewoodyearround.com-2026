import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import { imageField } from "../documents/maplewood-fields";
import {
  featureItemsField,
  sectionAnchorField,
  taglineField,
  sectionTitleField,
  sectionDescriptionField,
  sectionActionsField,
  contentCardsField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "electiveCards",
  title: "Elective cards",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    taglineField,
    sectionTitleField,
    sectionDescriptionField,
    defineField({
      name: "content",
      title: "Text",
      type: "basicRichText",
      description: "The paragraph under the heading.",
    }),
    featureItemsField,
    imageField(),
    contentCardsField,
    sectionActionsField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Elective cards",
      subtitle: "Elective cards",
    }),
  },
});
