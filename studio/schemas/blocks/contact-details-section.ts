import { sectionBackgroundField } from "./shared/section-background";
import { defineType } from "sanity";
import { featureItemsField } from "./shared/maplewood-fields";

/** Contact cards (Webflow contact21): icon, heading and the email, telephone or address links. */
export default defineType({
  name: "contactDetailsSection",
  title: "Contact details",
  type: "object",
  description: "Cards with an icon and heading over contact links, such as email, telephone and directions.",
  fields: [
    sectionBackgroundField,
    {
      ...featureItemsField,
      title: "Contact cards",
      description:
        "Cards in display order. Put each email, telephone or map link in the text as a link.",
      validation: (rule) => rule.required().min(1).max(4),
    },
  ],
  preview: {
    select: { title: "features.0.title" },
    prepare: ({ title }) => ({
      title: title || "Contact details",
      subtitle: "Contact details",
    }),
  },
});
