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
  name: "programOffering",
  title: "Program offering",
  type: "document",
  description: "A named program, such as Preschool or the Play Center.",
  fields: [
    titleField,
    slugField,
    programField,
    descriptionField(),
    imageField(),
    defineField({
      name: "listingGroup",
      title: "Card group",
      type: "string",
      description: "Which program-card section shows this offering.",
      options: { list: ["main", "additional", "enrichment"] },
    }),
    defineField({
      name: "days",
      title: "Days",
      type: "string",
      description: "The days on which the program runs.",
      options: { list: ["Tue, Thu", "Mo, Wed, Fri", "Mo-Fri", "Mo-Sat"] },
    }),
    referencesField(
      "activities",
      "Activities",
      "activity",
      "The activities offered by this program.",
    ),
    defineField({
      name: "color",
      title: "Label color",
      type: "string",
      description: "The source color for the program label, as a CSS color.",
    }),
    defineField({
      name: "destination",
      title: "Program page",
      type: "contentDestination",
      description: "The page or website opened by the program card.",
    }),
    orderField,
    visibleField,
  ],
  preview: contentPreview,
});
