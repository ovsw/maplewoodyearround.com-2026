import { LinkIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "buttonLink",
  title: "Button Link",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "variant",
      title: "Button Style",
      type: "string",
      initialValue: "default",
      options: {
        layout: "radio",
        list: [
          { title: "Default", value: "default" },
          { title: "Secondary", value: "secondary" },
          { title: "Outline", value: "outline" },
          { title: "Link", value: "link" },
        ],
      },
    }),
    defineField({
      name: "customLink",
      title: "Button Destination",
      type: "customUrl",
      validation: (rule) => rule.required(),
    }),
  ],
});
