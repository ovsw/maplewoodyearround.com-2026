import { defineArrayMember, defineField, defineType } from "sanity";
import GradeCheckboxesInput from "../inputs/grade-checkboxes-input";
import {
  descriptionField,
  imageField,
  orderField,
  slugField,
  titleField,
  visibleField,
} from "./maplewood-fields";

export default defineType({
  name: "summerActivity",
  title: "Summer activity",
  type: "document",
  description:
    "Something campers do at Summer Camp. It shows for every Camp group in its grades.",
  fields: [
    titleField,
    slugField,
    defineField({
      name: "category",
      title: "Activity category",
      type: "reference",
      to: [{ type: "activityCategory" }],
      description: "The category used by the Summer Camp activity filter.",
      validation: (rule) =>
        rule.required().error("Choose the Activity category."),
    }),
    defineField({
      name: "grades",
      title: "Grades",
      type: "array",
      description:
        "Every Camp group in these grades can take part. Tick at least one grade.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "grade" }] })],
      components: { input: GradeCheckboxesInput },
      validation: (rule) => [
        rule.required().min(1).error("Tick at least one grade."),
        rule.unique(),
      ],
    }),
    imageField(),
    descriptionField(),
    orderField,
    visibleField,
  ],
  preview: {
    select: { title: "title", subtitle: "category.title", media: "image" },
  },
});
