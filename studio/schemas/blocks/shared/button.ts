import { defineField, defineType } from "sanity";
import { createIconPreview } from "../../inputs/icon-input";
import { iconField } from "./icon";

export default defineType({
  name: "button",
  title: "Button",
  type: "object",
  fields: [
    defineField({
      name: "variant",
      type: "string",
      hidden: ({ document }) =>
        document?._type === "blogPostSettings" || document?._type === "settings",
      initialValue: "default",
      options: {
        layout: "radio",
        list: [
          { title: "Default", value: "default" },
          { title: "Secondary", value: "secondary" },
          { title: "Outline", value: "outline" },
          { title: "Ghost", value: "ghost" },
          { title: "Link", value: "link" },
        ],
      },
    }),
    defineField({
      name: "text",
      title: "Button Text",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      ...iconField,
      description: "Optional icon shown before the button text.",
    }),
    defineField({ name: "url", title: "URL", type: "customUrl" }),
  ],
  preview: {
    select: { icon: "icon.svg", title: "text", subtitle: "url.external" },
    prepare: ({ icon, title, subtitle }) => ({
      title,
      subtitle,
      media: icon ? createIconPreview(icon) : undefined,
    }),
  },
});
