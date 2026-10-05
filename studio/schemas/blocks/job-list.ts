import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import { sectionTitleField, programFilterField } from "./shared/maplewood-fields";

/** Current openings (Webflow career12): visible Job Opportunities with their Apply links. */
export default defineType({
  name: "jobList",
  title: "Job opportunities",
  type: "object",
  description:
    "A heading and introduction beside the visible job opportunities. Edit each job and its Apply link under About → Job Opportunities.",
  fields: [
    sectionBackgroundField,
    sectionTitleField,
    defineField({
      name: "intro",
      title: "Introduction",
      type: "simpleRichText",
      description: "Shown under the heading.",
    }),
    {
      ...programFilterField,
      description: "Optional. Show only the jobs of this program.",
    },
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Job opportunities",
      subtitle: "Job opportunities",
    }),
  },
});
