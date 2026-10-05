import { LayoutGrid } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionBackgroundField } from "./shared/section-background";
import {
  accentField,
  breadcrumbsField,
  iconField,
  sectionAnchorField,
  taglineField,
} from "./shared/maplewood-fields";

const iconCard = defineArrayMember({
  name: "iconCard",
  title: "Card",
  type: "object",
  fields: [
    iconField,
    accentField,
    defineField({
      name: "title",
      title: "Heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      title: "Short label",
      type: "string",
      description: 'Optional line under the heading, such as "ages: 3-4, 4-5".',
    }),
    defineField({
      name: "body",
      title: "Text",
      type: "simpleRichText",
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "contentAction",
      description: "Optional link below the text. It is hidden until it has a destination.",
    }),
  ],
  preview: { select: { title: "title", subtitle: "label" } },
});

/** A heading and introduction beside a row of icon cards (Webflow layout248 and layout311). */
export default defineType({
  name: "iconCards",
  title: "Icon cards",
  type: "object",
  icon: LayoutGrid,
  description: "A heading and introduction, then cards with an icon, text and a link.",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    {
      ...breadcrumbsField,
      description:
        "Optional. With breadcrumbs, the heading is the page heading (for a page without a hero).",
    },
    taglineField,
    defineField({
      name: "title",
      title: "Heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      title: "Introduction",
      type: "simpleRichText",
      description: "Shown beside the heading.",
    }),
    defineField({
      name: "cards",
      title: "Cards",
      type: "array",
      description: "Cards in display order.",
      of: [iconCard],
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Untitled Icon cards",
      subtitle: "Icon cards",
    }),
  },
});
