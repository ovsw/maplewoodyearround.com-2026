import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
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
    defineField({
      name: "highlightText",
      title: "Highlighted phrase",
      type: "string",
    }),
    defineField({ name: "eyebrow", title: "Short label", type: "string" }),
    defineField({
      name: "body",
      title: "Text and links",
      type: "richTextContent",
    }),
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
