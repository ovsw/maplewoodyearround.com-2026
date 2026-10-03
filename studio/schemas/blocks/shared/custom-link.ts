import { LinkIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/** The single inline-link annotation shared by every Portable Text profile. */
export default defineType({
  name: "customLink",
  title: "Link",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "customLink",
      title: "Link",
      type: "customUrl",
      validation: (rule) => rule.required(),
    }),
  ],
});
