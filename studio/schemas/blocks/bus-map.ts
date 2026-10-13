import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
  sectionActionsField,
  contentCardsField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "busMap",
  title: "Bus map and benefits",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField,
    defineField({ name: "eyebrow", title: "Short label", type: "string" }),
    sectionDescriptionField,
    contentCardsField,
    sectionActionsField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Bus map and benefits",
      subtitle: "Bus map and benefits",
    }),
  },
});
