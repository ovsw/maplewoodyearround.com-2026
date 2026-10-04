import { sectionBackgroundField } from "./shared/section-background";
import { defineArrayMember, defineField, defineType } from "sanity";
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
    {
      ...sectionDescriptionField,
      description: "Optional plain text under the heading. The text below replaces it.",
    },
    defineField({
      name: "intro",
      title: "Introduction",
      type: "simpleRichText",
      description: "Optional text under the heading, with bold words and links.",
    }),
    defineField({
      name: "checklists",
      title: "Checklists",
      type: "array",
      description: "Optional lists side by side above the cards, such as what a party includes.",
      of: [
        defineArrayMember({
          name: "checklist",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Heading", type: "string" }),
            { ...iconField, description: "The icon before each item." },
            accentField,
            defineField({
              name: "items",
              title: "Items",
              type: "simpleRichText",
              description: "One paragraph per item.",
            }),
          ],
          preview: { select: { title: "title" } },
        }),
      ],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: "checklistNote",
      title: "Note under the checklists",
      type: "simpleRichText",
    }),
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
