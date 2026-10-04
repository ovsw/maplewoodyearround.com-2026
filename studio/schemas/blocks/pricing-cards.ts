import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import {
  accentField,
  iconField,
  sectionTitleField,
  sectionDescriptionField,
  sectionActionsField,
  sectionAnchorField,
  taglineField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "pricingCards",
  title: "Pricing cards",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    taglineField,
    sectionTitleField,
    sectionDescriptionField,
    defineField({
      name: "plans",
      title: "Pricing cards",
      type: "array",
      description: "Plans or prices in display order.",
      of: [
        {
          name: "pricingPlan",
          type: "object",
          fields: [
            iconField,
            accentField,
            sectionTitleField,
            defineField({
              name: "price",
              title: "Price wording",
              type: "string",
              description:
                'The full displayed price and period, such as "$17/day". Text after "/" is shown smaller.',
            }),
            defineField({
              name: "details",
              title: "Details",
              type: "basicRichText",
              description: "What the plan includes, and its conditions.",
            }),
            sectionActionsField,
          ],
          preview: { select: { title: "title", subtitle: "price" } },
        },
      ],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Pricing cards",
      subtitle: "Pricing cards",
    }),
  },
});
