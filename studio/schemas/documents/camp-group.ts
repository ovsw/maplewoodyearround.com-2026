import { defineField, defineType } from "sanity";
import {
  orderField,
  referencesField,
  slugField,
  titleField,
  visibleField,
} from "./maplewood-fields";

const pdfField = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    type: "file",
    description,
    options: { accept: "application/pdf" },
  });

export default defineType({
  name: "campGroup",
  title: "Camp group",
  type: "document",
  description:
    "A Summer Camp group, with its Group schedule and Welcome letter for this summer.",
  fields: [
    titleField,
    slugField,
    {
      ...referencesField(
        "grades",
        "Entering grades",
        "grade",
        "Grades included in this camp group. The group's PDFs show under each of these grades.",
      ),
      validation: (rule) => [
        rule.required().min(1).error("Choose at least one Grade."),
        rule.unique(),
      ],
    },
    defineField({
      name: "gender",
      title: "Group",
      type: "string",
      description: "The group label shown on the source site.",
      options: { list: ["Girls", "Boys", "Coed"] },
    }),
    pdfField(
      "groupSchedule",
      "Group schedule",
      "This summer's schedule PDF. Upload the new PDF here each summer.",
    ),
    pdfField(
      "welcomeLetter",
      "Welcome letter",
      "This summer's welcome letter PDF. Upload the new PDF here each summer.",
    ),
    orderField,
    visibleField,
  ],
  preview: { select: { title: "title" } },
});
