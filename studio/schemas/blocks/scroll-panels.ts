import { sectionBackgroundField } from "./shared/section-background";
import { defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
  contentCardsField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "scrollPanels",
  title: "Scroll image and text panels",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField,
    sectionDescriptionField,
    contentCardsField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Scroll image and text panels",
      subtitle: "Scroll image and text panels",
    }),
  },
});
