import { defineField, defineType } from "sanity";
import {
  contentPreview,
  descriptionField,
  imageField,
  orderField,
  programField,
  referencesField,
  slugField,
  titleField,
  visibleField,
} from "./maplewood-fields";

export default defineType({
  name: "facility",
  title: "Facility",
  type: "document",
  description: "An indoor or outdoor facility for one part of Maplewood.",
  fields: [
    titleField,
    slugField,
    programField,
    descriptionField(),
    imageField(),
    referencesField(
      "categories",
      "Categories",
      "facilityCategory",
      "Categories visitors can use to filter this facility.",
    ),
    referencesField(
      "grades",
      "Applicable grades",
      "grade",
      "Only set grades confirmed by Maplewood. The old site has no reliable facility-to-grade assignments.",
    ),
    defineField({
      name: "location",
      title: "Indoor or outdoor",
      type: "string",
      description: "Where this facility is located.",
      options: { list: ["Indoor", "Outdoor"] },
    }),
    orderField,
    visibleField,
  ],
  preview: contentPreview,
});
