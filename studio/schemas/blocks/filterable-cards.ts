import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
  programFilterField,
  collectionSourceField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "filterableCards",
  title: "Filterable cards",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField,
    sectionDescriptionField,
    defineField({
      ...collectionSourceField,
      options: {
        list: [
          { title: "Summer activities", value: "summerActivity" },
          { title: "School Year activities", value: "schoolYearActivity" },
          { title: "Facilities", value: "facility" },
        ],
      },
    }),
    programFilterField,
    defineField({
      name: "searchPlaceholder",
      title: "Search prompt",
      type: "string",
      description: "The prompt inside the search field.",
    }),
    defineField({
      name: "emptyState",
      title: "No results message",
      type: "string",
      description: "What visitors see when no cards match their filters.",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Filterable cards",
      subtitle: "Filterable cards",
    }),
  },
});
