import { defineArrayMember, defineField, defineType } from "sanity";
import {
  orderField,
  programOptions,
  slugField,
  switchField,
  titleField,
  visibleField,
} from "./maplewood-fields";

export default defineType({
  name: "jobOpportunity",
  title: "Job opportunity",
  type: "document",
  fields: [
    titleField,
    slugField,
    defineField({
      name: "description",
      title: "Job description",
      type: "richTextContent",
      description: "Responsibilities and requirements shown to applicants.",
    }),
    defineField({
      name: "programs",
      title: "Programs",
      type: "array",
      description: "Choose Summer Camp, School Year, or both.",
      of: [defineArrayMember({ type: "string" })],
      options: { list: programOptions },
      validation: (rule) => rule.unique(),
    }),
    switchField(
      "seasonal",
      "Seasonal",
      "Show that this is a seasonal position.",
    ),
    defineField({
      name: "applyLink",
      title: "Apply link",
      type: "contentDestination",
      description:
        "Where visitors apply. The button is hidden until a destination is set.",
    }),
    orderField,
    visibleField,
  ],
  preview: { select: { title: "title" } },
});
