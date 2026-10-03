import { defineArrayMember, defineField, defineType } from "sanity";

function validateSidebarButton(value: unknown) {
  if (!value || typeof value !== "object") return "Add a button";

  const button = value as Record<string, unknown>;
  if (typeof button.text !== "string" || !button.text.trim()) {
    return "Add button text";
  }
  if (!button.url || typeof button.url !== "object") {
    return "Add a button destination";
  }

  return true;
}

export const blogPostSidebarAction = defineType({
  name: "blogPostSidebarAction",
  title: "Sidebar Action",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "actionType",
      title: "Action Type",
      type: "string",
      deprecated: {
        reason: "The destination now determines the icon automatically.",
      },
      hidden: true,
      initialValue: undefined,
      readOnly: true,
      options: {
        layout: "radio",
        list: [
          { title: "Call", value: "call" },
          { title: "Form", value: "form" },
          { title: "Outbound Link", value: "outboundLink" },
        ],
      },
    }),
    defineField({
      name: "button",
      type: "button",
      validation: (rule) => rule.required().custom(validateSidebarButton),
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "button.text",
    },
  },
});

export const blogPostSidebarFields = [
  defineField({
    name: "title",
    type: "string",
  }),
  defineField({
    name: "description",
    type: "text",
    rows: 2,
  }),
  defineField({
    name: "actions",
    type: "array",
    description:
      "The first action is the primary button. Later actions appear as text links.",
    of: [defineArrayMember({ type: "blogPostSidebarAction" })],
  }),
];

/**
 * The call-to-action panel shown beside blog post bodies. Single object rather
 * than a keyed array: there is exactly one blog post sidebar, so selecting one
 * by key would be indirection with nothing to select between.
 */
export const blogPostSidebar = defineType({
  name: "blogPostSidebar",
  title: "Blog Post Sidebar",
  type: "object",
  description:
    "Calls to action shown alongside blog post content. Keep this to two or three actions — the panel is sticky, and a taller panel than the screen cannot stay pinned while readers scroll.",
  fields: blogPostSidebarFields,
  preview: {
    select: {
      title: "title",
      actions: "actions",
    },
    prepare({ title, actions }) {
      const count = Array.isArray(actions) ? actions.length : 0;
      return {
        title: title || "Blog Post Sidebar",
        subtitle: `${count} action${count === 1 ? "" : "s"}`,
      };
    },
  },
});
