import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
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
    defineField({
      name: "characterTime",
      title: "Character visit time",
      type: "string",
      description:
        'For calendar days: shown after each day\'s character, such as "10:30am & 3pm".',
      hidden: ({ parent }) => parent?.source !== "playgroundEvent",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Collection card slider",
      subtitle: "Collection card slider",
    }),
  },
});
