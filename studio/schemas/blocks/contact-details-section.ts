import { sectionBackgroundField } from "./shared/section-background";
import { defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
  sectionActionsField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "contactDetailsSection",
  title: "Contact details",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField,
    sectionDescriptionField,
    sectionActionsField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Contact details",
      subtitle: "Contact details",
    }),
  },
});
