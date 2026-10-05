import { Megaphone } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionBackgroundField } from "./shared/section-background";
import { accentField, iconField, sectionAnchorField } from "./shared/maplewood-fields";

export default defineType({
  name: "ctaBanner",
  title: "Call to Action",
  type: "object",
  icon: Megaphone,
  description:
    "A clear invitation with a heading, supporting line, and up to two actions. Closing bands end a page; nudges sit quietly between sections.",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    defineField({
      name: "variant",
      title: "Weight",
      type: "string",
      description:
        "Closing: the full-width band that ends a page. Nudge: a quiet in-page prompt between sections.",
      initialValue: "closing",
      options: {
        layout: "radio",
        list: [
          { title: "Closing band", value: "closing" },
          { title: "In-page nudge", value: "nudge" },
        ],
      },
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The question or statement that prompts visitors to act.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "string",
      description: "Optional supporting sentence shown under the heading",
    }),
    defineField({
      name: "body",
      title: "Text",
      type: "simpleRichText",
      description: "Optional longer text with links, shown instead of the supporting sentence.",
    }),
    { ...iconField, description: "Optional icon before the heading of a text banner." },
    accentField,
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      description: "Optional image beside the text.",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Image description", type: "string" }),
      ],
    }),
    defineField({
      name: "buttons",
      type: "array",
      description:
        "Optional actions. A notice can contain supporting text without a button.",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.max(2),
    }),
  ],
  preview: {
    select: { title: "title", variant: "variant" },
    prepare: ({ title, variant }) => ({
      title: title || "Untitled Call to Action",
      subtitle: variant === "nudge" ? "Call to Action · nudge" : "Call to Action · closing band",
    }),
  },
});
