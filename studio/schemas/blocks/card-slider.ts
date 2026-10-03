import { defineType } from "sanity";
import { sectionTitleField, sectionDescriptionField, collectionSourceField, collectionFilterFields } from "./shared/maplewood-fields";

export default defineType({
  name: "cardSlider",
  title: "Collection card slider",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField, sectionDescriptionField, collectionSourceField, ...collectionFilterFields,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Collection card slider", subtitle: "Collection card slider" }),
  },
});
import { sectionBackgroundField } from "./shared/section-background";
