import { defineType } from "sanity";
import { sectionBackgroundField } from "./shared/section-background";
import {
  sectionTitleField,
  sectionDescriptionField,
  contentCardsField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "tabbedHero",
  title: "Tabbed image hero",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField,
    sectionDescriptionField,
    contentCardsField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title: previewTitle }) => ({
      title: previewTitle || "Untitled Tabbed image hero",
      subtitle: "Tabbed image hero",
    }),
  },
});
