import { Quote } from "lucide-react";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  icon: Quote,
  description:
    "A reusable customer or stakeholder quote that can be referenced by project-specific sections.",
  initialValue: {
    rating: 5,
  },
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "The person or organization giving the testimonial.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Role or relation",
      type: "string",
      description:
        "Who this person is to the camp, e.g. \"Parent of a first-year camper\" or \"Camper, age 12\".",
    }),
    defineField({
      name: "origin",
      title: "Origin",
      type: "string",
      description: "Optional city or country shown after the role, e.g. \"Toronto\" or \"Mexico City\".",
    }),
    defineField({
      name: "image",
      title: "Portrait",
      type: "image",
      description:
        "Face of the person, shown as a round avatar beside their name. Set the hotspot on the face.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt Text",
        }),
      ],
    }),
    defineField({
      name: "body",
      title: "Quote",
      type: "simpleRichText",
      description: "The testimonial text.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      description: "Optional numeric rating from 1 to 5.",
      validation: (rule) => rule.min(1).max(5),
    }),
  ],

  preview: {
    select: {
      title: "name",
      subtitle: "title",
      media: "image",
    },
    prepare: ({ media, subtitle, title }) => ({
      title: title || "Untitled Testimonial",
      subtitle: subtitle || "Reusable testimonial",
      media,
    }),
  },
});
