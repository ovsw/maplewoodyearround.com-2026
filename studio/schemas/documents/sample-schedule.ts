import { defineField, defineType } from "sanity";
import {
  contentPreview,
  descriptionField,
  imageField,
  orderField,
  programField,
  slugField,
  textField,
  titleField,
} from "./maplewood-fields";

export default defineType({
  name: "sampleSchedule",
  title: "Sample schedule entry",
  type: "document",
  description: "One activity in the example day for a program.",
  fields: [
    titleField,
    slugField,
    programField,
    textField(
      "activity",
      "Activity",
      "The activity name shown at this point in the day.",
    ),
    imageField(),
    descriptionField(),
    defineField({
      name: "audience",
      title: "Program or age group",
      type: "string",
      description: "The sample day this entry belongs to.",
      options: {
        list: [
          "Preschool & Kindergarten",
          "1st–7th Grade",
          "CIT (8th–9th grade)",
          "Preschool",
        ],
      },
      validation: (rule) => rule.required(),
    }),
    orderField,
  ],
  preview: contentPreview,
});
