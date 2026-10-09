import { Palette } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import {
  descriptionField,
  imageField,
  orderField,
  slugField,
  titleField,
  visibleField,
} from "./maplewood-fields";

export default defineType({
  name: "schoolYearActivity",
  title: "School Year activity",
  type: "document",
  icon: Palette,
  description:
    "Something offered in School Year programs. It shows in the lists of every Program it names.",
  fields: [
    titleField,
    slugField,
    defineField({
      name: "programs",
      title: "Programs",
      type: "array",
      description: "The School Year programs that offer this activity. Choose at least one.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "programOffering" }],
          options: { filter: 'program == "schoolYear"' },
        }),
      ],
      validation: (rule) => [
        rule.required().min(1).error("Choose at least one Program."),
        rule.unique(),
      ],
    }),
    defineField({
      name: "availability",
      title: "Available days or session",
      type: "string",
      description: "When this activity is available.",
      options: {
        list: [
          "Mo-Fri",
          "Mo-Sat",
          "Schedule AM",
          "Schedule PM",
          "School Vacation",
        ],
      },
    }),
    defineField({
      name: "location",
      title: "Indoor, outdoor or special",
      type: "string",
      description: "The location group used in activity lists.",
      options: { list: ["Indoor", "Outdoor", "Special"], layout: "radio" },
    }),
    imageField(),
    descriptionField(),
    orderField,
    visibleField,
  ],
  preview: {
    select: { title: "title", subtitle: "location", media: "image" },
  },
});
