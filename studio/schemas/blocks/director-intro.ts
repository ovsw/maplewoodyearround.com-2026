import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
  sectionActionsField,
  sectionVideoFields,
} from "./shared/maplewood-fields";
import { imageField } from "../documents/maplewood-fields";

export default defineType({
  name: "directorIntro",
  title: "Director introduction",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField,
    sectionDescriptionField,
    ...sectionVideoFields,
    imageField(),
    defineField({
      name: "body",
      title: "Story",
      type: "richTextContent",
      description: "The director's story and public biography.",
    }),
    sectionActionsField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Director introduction",
      subtitle: "Director introduction",
    }),
  },
});
