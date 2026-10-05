import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionVideoFields } from "./shared/maplewood-fields";

const directorPanel = defineArrayMember({
  name: "directorPanel",
  title: "Panel",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Heading",
      type: "string",
      description: "The first panel's heading is the page heading.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Text",
      type: "simpleRichText",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: "title" } },
});

/** The director's story (Webflow layout355): text panels scroll over a background video. */
export default defineType({
  name: "directorIntro",
  title: "Director introduction",
  type: "object",
  description:
    "Story panels that scroll over a full-screen background video. Panels alternate between the left and right side.",
  fields: [
    defineField({
      name: "panels",
      title: "Panels",
      type: "array",
      description: "Panels in reading order. The first one shows on the left.",
      of: [directorPanel],
      validation: (rule) => rule.required().min(1),
    }),
    ...sectionVideoFields,
  ],
  preview: {
    select: { title: "panels.0.title" },
    prepare: ({ title }) => ({
      title: title || "Director introduction",
      subtitle: "Director introduction",
    }),
  },
});
