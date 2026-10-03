import { defineField, defineType } from "sanity";
import { textField } from "./maplewood-fields";

export default defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    textField("role", "Role", "The author's public role or job title."),
    defineField({
      description: "The public name shown with this item.",
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      description:
        "The unique URL name. Use lowercase words separated by hyphens.",
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      description:
        "The image shown with this item. Set the crop and focal point.",
      name: "image",
      title: "Image",
      type: "image",
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "name",
      media: "image",
    },
  },
});
