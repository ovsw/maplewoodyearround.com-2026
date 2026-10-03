import { UserRound } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "teamMember",
  title: "Team Member",
  type: "document",
  icon: UserRound,
  description:
    "A reusable person profile that can be selected in team sections.",
  fields: [
    defineField({
      name: "name",
      type: "string",
      title: "Name",
      description: "The full name shown on this team member profile.",
      validation: (rule) =>
        rule.required().error("A team member name is required"),
    }),
    defineField({
      name: "role",
      type: "string",
      title: "Role",
      description:
        "The team member's job title or public-facing responsibility.",
    }),
    defineField({
      name: "yearsAtOrganization",
      type: "number",
      title: "Years with the organization",
      description:
        "Years with the organization. Leave blank until confirmed.",
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: "shortBio",
      type: "text",
      title: "Short Introduction",
      rows: 2,
      description:
        "One short sentence that helps a parent get to know this person: a personal interest, how they welcome campers, or what they enjoy about camp. Confirm it with the person before launch.",
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: "email",
      type: "string",
      title: "Email",
      description: "The public email address used by the profile's email link.",
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: "phone",
      type: "string",
      title: "Phone",
      description:
        "The public phone number shown on the profile and used by its call link.",
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Photo",
      description:
        "A profile photo for this team member. Add alt text that identifies the person.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt Text",
          description:
            "The text that identifies this person for screen readers and search engines.",
          validation: (rule) =>
            rule.custom((value, context) => {
              const parent = context.parent as { asset?: unknown } | undefined;
              return parent?.asset && !value?.trim()
                ? "Alt text is required when a photo is set"
                : true;
            }),
        }),
      ],
    }),
    defineField({
      name: "bio",
      type: "array",
      title: "Bio",
      description:
        "A short biography describing this team member's responsibilities and expertise.",
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
    defineField({
      name: "sortOrder",
      type: "number",
      title: "Display Order",
      description:
        "The order used when this team member is placed automatically in team lists.",
      validation: (rule) => rule.integer().positive(),
    }),
  ],
  preview: {
    select: {
      title: "name",
      role: "role",
      media: "image",
    },
    prepare: ({ media, role, title }) => ({
      title: title || "Unnamed Team Member",
      subtitle: role || "Reusable profile",
      media,
    }),
  },
});
