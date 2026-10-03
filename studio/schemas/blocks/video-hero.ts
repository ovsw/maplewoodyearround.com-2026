import { defineField, defineType } from "sanity";
import { sectionTitleField, sectionDescriptionField, sectionActionsField, sectionVideoFields } from "./shared/maplewood-fields";

export default defineType({
  name: "videoHero",
  title: "Video hero",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField, sectionDescriptionField, sectionActionsField, ...sectionVideoFields,
    defineField({ name: "overlayOpacity", title: "Video shading", type: "number", description: "Darken the video behind the title. Use a value from 0 to 1.", initialValue: 0.45, validation: (rule) => rule.min(0).max(1) }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Video hero", subtitle: "Video hero" }),
  },
});
import { sectionBackgroundField } from "./shared/section-background";
