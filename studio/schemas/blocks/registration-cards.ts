import { ClipboardList } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionBackgroundField } from "./shared/section-background";
import {
  accentField,
  iconField,
  sectionActionsField,
  sectionAnchorField,
  taglineField,
} from "./shared/maplewood-fields";

const registrationCard = defineArrayMember({
  name: "registrationCard",
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
      name: "body",
      title: "Text",
      type: "simpleRichText",
    }),
    defineField({
      name: "links",
      title: "Registration links",
      type: "array",
      description:
        "Links under the text, such as a registration form or waiver. Several links show as a list. A link stays hidden until it has a destination.",
      of: [defineArrayMember({ type: "contentAction" })],
    }),
  ],
  preview: { select: { title: "title" } },
});

/** A program's registration heading, then cards of registration links (Webflow contact24 on /contact). */
export default defineType({
  name: "registrationCards",
  title: "Registration cards",
  type: "object",
  icon: ClipboardList,
  description:
    "A program label, icon and heading with an introduction and button, then cards with registration links.",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    taglineField,
    iconField,
    { ...accentField, description: "The colour of the heading icon." },
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
    }),
    { ...sectionActionsField, description: "Optional buttons under the introduction." },
    defineField({
      name: "cards",
      title: "Cards",
      type: "array",
      description: "Cards in display order.",
      of: [registrationCard],
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Untitled Registration cards",
      subtitle: "Registration cards",
    }),
  },
});
