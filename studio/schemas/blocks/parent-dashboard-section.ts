import { sectionBackgroundField } from "./shared/section-background";
import { defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "parentDashboardSection",
  title: "Parent dashboard",
  type: "object",
  fields: [sectionBackgroundField, sectionTitleField, sectionDescriptionField],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Parent dashboard",
      subtitle: "Parent dashboard",
    }),
  },
});
