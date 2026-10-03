import { UsersRound } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { programFilterField } from "./shared/maplewood-fields";
import { sectionBackgroundField } from "./shared/section-background";

export default defineType({
  name: "teamMembers",
  title: "Team Members",
  type: "object",
  icon: UsersRound,
  description: "A staff section selected by program and profile group.",
  fields: [
    sectionBackgroundField,
    defineField({
      name: "presentation",
      type: "string",
      title: "Presentation",
      description:
        "Choose detailed profiles or roster cards with a portrait, name, role, years with the organization, and short introduction.",
      initialValue: "profiles",
      options: {
        layout: "radio",
        list: [
          { title: "Detailed profiles", value: "profiles" },
          { title: "Compact roster", value: "roster" },
        ],
      },
    }),
    defineField({
      name: "eyebrow",
      type: "string",
      title: "Eyebrow",
      description: "Optional short label shown above the section title.",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The main heading for the team section.",
    }),
    defineField({
      name: "richText",
      type: "array",
      title: "Intro Text",
      description:
        "Optional introductory copy shown before the team member profiles.",
      of: [
        defineArrayMember({
          type: "block",
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
            ],
          },
        }),
      ],
    }),
    programFilterField,
    defineField({
      name: "profileGroup",
      title: "Profile group",
      type: "string",
      description: "Choose the staff roster or authored leadership profiles.",
      initialValue: "roster",
      options: { list: ["roster", "leadership"] },
    }),
    defineField({
      name: "preschoolOnly",
      title: "Preschool teachers only",
      type: "boolean",
      description: "Only show preschool teachers.",
    }),
    defineField({
      name: "tourGuidesOnly",
      title: "Tour guides only",
      type: "boolean",
      description: "Only show School Year tour guides.",
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare: ({ title }) => ({
      title: title || "Team Members",
      subtitle: "Team Members",
    }),
  },
});
