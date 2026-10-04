import { House } from "lucide-react";
import { defineField, defineType } from "sanity";
import { homePageBlocksField } from "../blocks/page-builder";
import meta from "../blocks/shared/meta";

export default defineType({
  name: "homePage",
  title: "Home Page",
  type: "document",
  icon: House,
  groups: [
    { name: "content", title: "Content" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      description: "The title used to identify this content.",
      name: "title",
      type: "string",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      description: "A short introduction or summary for this content.",
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      group: "content",
    }),
    homePageBlocksField,
    meta,
  ],
  preview: {
    select: { title: "title", subtitle: "description" },
    prepare: ({ subtitle, title }) => ({
      title: title || "Untitled Home Page",
      subtitle: subtitle || "/",
    }),
  },
});
