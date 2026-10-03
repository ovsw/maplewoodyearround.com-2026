import { defineField, defineType } from "sanity";
import { sectionTitleField, sectionDescriptionField, sectionActionsField } from "./shared/maplewood-fields";

export default defineType({
  name: "pricingCards",
  title: "Pricing cards",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField, sectionDescriptionField,
    defineField({ name: "plans", title: "Pricing cards", type: "array", description: "Plans or prices in display order.", of: [{ name: "pricingPlan", type: "object", fields: [
      sectionTitleField,
      defineField({ name: "price", title: "Price wording", type: "string", description: "The full displayed price and period; no automatic calculations." }),
      defineField({ name: "details", title: "Details", type: "richTextContent", description: "What the plan includes, and its conditions." }),
      sectionActionsField,
    ], preview: { select: { title: "title", subtitle: "price" } } }] }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Pricing cards", subtitle: "Pricing cards" }),
  },
});
import { sectionBackgroundField } from "./shared/section-background";
