import { defineField, defineType } from "sanity";
import { contentPreview, descriptionField, imageField, orderField, programField, referenceField, referencesField, slugField, textField, titleField, visibleField } from "./maplewood-fields";

export default defineType({
  name: "activity", title: "Activity", type: "document",
  description: "An activity in Summer Camp or School Year lists.",
  fields: [
    titleField, slugField, programField, imageField(), descriptionField(),
    referenceField("category", "Activity category", "activityCategory", "The category used by the Summer Camp activity filter."),
    referencesField("groups", "Camp groups", "campGroup", "Groups that can take part. Their grades supply the activity grade filter."),
    referencesField("programs", "School Year programs", "programOffering", "School Year programs that offer this activity."),
    textField("gradeLabel", "Grade label", "The original grade text shown with the activity."),
    descriptionField("groupText", "Group description"),
    defineField({ name: "availability", title: "Available days or session", type: "string", description: "When this School Year activity is available.", options: { list: ["Mo-Fri", "Mo-Sat", "Schedule AM", "Schedule PM", "School Vacation"] } }),
    textField("playgroundLabel", "Playground label", "The source playground grouping label; keep its wording."),
    defineField({ name: "location", title: "Indoor, outdoor or special", type: "string", description: "The location group used in activity lists.", options: { list: ["Indoor", "Outdoor", "Special"] } }),
    orderField, visibleField,
  ],
  preview: contentPreview,
});
