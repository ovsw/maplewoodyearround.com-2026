import { defineType } from "sanity";
import { orderField, programField, referencesField, slugField, titleField } from "./maplewood-fields";

export const facilityCategory = defineType({
  name: "facilityCategory", title: "Facility category", type: "document",
  fields: [titleField, slugField, programField, orderField],
  preview: { select: { title: "title", subtitle: "program" } },
});

export const activityCategory = defineType({
  name: "activityCategory", title: "Activity category", type: "document",
  fields: [titleField, slugField, referencesField("activities", "Activities", "activity", "Activities assigned to this source category."), orderField],
  preview: { select: { title: "title" } },
});

export const grade = defineType({
  name: "grade", title: "Grade", type: "document",
  fields: [titleField, slugField, orderField],
  preview: { select: { title: "title" } },
});

export const season = defineType({
  name: "season", title: "Season", type: "document",
  fields: [titleField, slugField, programField, orderField],
  preview: { select: { title: "title", subtitle: "program" } },
});
