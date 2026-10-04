import { sectionBackgroundField } from "./shared/section-background";
import { defineType } from "sanity";
import {
  accentField,
  iconField,
  sectionAnchorField,
  taglineField,
  sectionTitleField,
  sectionDescriptionField,
  sectionActionsField,
  collectionSourceField,
  collectionFilterFields,
} from "./shared/maplewood-fields";

export default defineType({
  name: "cardSlider",
  title: "Collection card slider",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    taglineField,
    { ...iconField, description: "Optional icon before the heading." },
    accentField,
    sectionTitleField,
    sectionDescriptionField,
    sectionActionsField,
    collectionSourceField,
    ...collectionFilterFields,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Collection card slider",
      subtitle: "Collection card slider",
    }),
  },
});
