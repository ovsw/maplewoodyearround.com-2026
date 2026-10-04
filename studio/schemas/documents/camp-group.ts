import { defineField, defineType } from "sanity";
import {
  orderField,
  referencesField,
  slugField,
  titleField,
  visibleField,
} from "./maplewood-fields";

export default defineType({
  name: "campGroup",
  title: "Camp group",
  type: "document",
  description: "A Summer Camp group. Its PDFs are edited in Summer documents.",
  fields: [
    titleField,
    slugField,
    referencesField(
      "grades",
      "Entering grades",
      "grade",
      "Grades included in this camp group.",
    ),
    defineField({
      name: "gender",
      title: "Group",
      type: "string",
      description: "The group label shown on the source site.",
      options: { list: ["Girls", "Boys", "Coed"] },
    }),
    referencesField(
      "activities",
      "Activities",
      "activity",
      "Activities available to this group.",
    ),
    orderField,
    visibleField,
  ],
  preview: { select: { title: "title" } },
});
