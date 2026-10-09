import { defineField, defineType } from "sanity";
import { seasonPeriod } from "../validation/season-period";
import {
  orderField,
  programField,
  programOptions,
  referencesField,
  slugField,
  titleField,
} from "./maplewood-fields";

export const facilityCategory = defineType({
  name: "facilityCategory",
  title: "Facility category",
  type: "document",
  fields: [titleField, slugField, programField, orderField],
  preview: { select: { title: "title", subtitle: "program" } },
});

export const activityCategory = defineType({
  name: "activityCategory",
  title: "Activity category",
  type: "document",
  fields: [
    titleField,
    slugField,
    referencesField(
      "activities",
      "Activities",
      "activity",
      "Activities assigned to this source category.",
    ),
    orderField,
  ],
  preview: { select: { title: "title" } },
});

export const grade = defineType({
  name: "grade",
  title: "Grade",
  type: "document",
  fields: [titleField, slugField, orderField],
  preview: { select: { title: "title" } },
});

export const season = defineType({
  name: "season",
  title: "Season",
  type: "document",
  fields: [
    titleField,
    slugField,
    programField,
    defineField({
      name: "startDate",
      title: "Start date",
      type: "date",
      description: "The first day of this Season.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "End date",
      type: "date",
      description:
        "The last day of this Season. Seasons of the same side cannot overlap.",
      validation: (rule) => rule.required().custom(seasonPeriod),
    }),
  ],
  preview: {
    select: {
      title: "title",
      program: "program",
      startDate: "startDate",
      endDate: "endDate",
    },
    prepare: ({ title, program, startDate, endDate }) => {
      const side = programOptions.find((option) => option.value === program);
      const dates =
        startDate && endDate ? `${startDate} to ${endDate}` : "No dates";
      return {
        title,
        subtitle: [side?.title, dates].filter(Boolean).join(" · "),
      };
    },
  },
});
