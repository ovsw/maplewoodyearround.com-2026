import { sectionBackgroundField } from "./shared/section-background";
import { defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
  sectionActionsField,
} from "./shared/maplewood-fields";
import { imageField } from "../documents/maplewood-fields";

export default defineType({
  name: "imageReveal",
  title: "Image width reveal",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField,
    sectionDescriptionField,
    imageField(),
    sectionActionsField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Image width reveal",
      subtitle: "Image width reveal",
    }),
  },
});
