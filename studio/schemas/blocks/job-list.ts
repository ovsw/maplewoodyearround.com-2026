import { sectionBackgroundField } from "./shared/section-background";
import { defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
  programFilterField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "jobList",
  title: "Job opportunities",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField,
    sectionDescriptionField,
    programFilterField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Job opportunities",
      subtitle: "Job opportunities",
    }),
  },
});
