import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
  programFilterField,
  breadcrumbsField,
  sectionAnchorField,
  taglineField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "programCards",
  title: "Program cards",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    breadcrumbsField,
    taglineField,
    sectionTitleField,
    sectionDescriptionField,
    programFilterField,
    defineField({
      name: "listingGroup",
      title: "Card group",
      type: "string",
      description:
        "Show offerings from this card group. Leave empty for all groups.",
      options: { list: ["main", "additional", "enrichment", "seasons"] },
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Program cards",
      subtitle: "Program cards",
    }),
  },
});
