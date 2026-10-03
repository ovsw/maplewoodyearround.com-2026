import { Rows3 } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionBackgroundField } from "./shared/section-background";
import NavigationIconInput, {
  createNavigationIconPreview,
} from "../inputs/navigation-icon-input";
import { isNavigationIconName } from "../inputs/lucide-icon-catalog";

const richTextToPlainText = (value: unknown): string => {
  if (!Array.isArray(value)) return "";
  return value
    .map((block) => {
      const children = (block as { children?: { text?: string }[] })?.children;
      if (!Array.isArray(children)) return "";
      return children.map((child) => child?.text ?? "").join("");
    })
    .join(" ")
    .trim();
};

const rowItem = defineArrayMember({
  name: "stackedFeatureRowItem",
  title: "Item",
  type: "object",
  fields: [
    defineField({
      name: "body",
      title: "Text",
      type: "simpleRichText",
      description: "One point or paragraph. Supports bold, italic, and links.",
      validation: (rule) => rule.required().max(1),
    }),
  ],
  preview: {
    select: { body: "body" },
    prepare: ({ body }) => ({
      title: richTextToPlainText(body) || "Untitled Item",
    }),
  },
});

const row = defineArrayMember({
  name: "stackedFeatureRow",
  title: "Row",
  type: "object",
  fields: [
    defineField({
      name: "icon",
      title: "Icon",
      type: "object",
      description: "Choose an icon shown beside this row heading.",
      components: {
        input: NavigationIconInput,
      },
      fields: [
        defineField({ name: "name", title: "Name", type: "string" }),
        defineField({
          name: "svg",
          title: "SVG markup",
          type: "string",
          hidden: true,
        }),
      ],
      validation: (rule) =>
        rule.custom((value) => {
          const icon = value as { name?: string; svg?: string } | undefined;
          if (!icon?.name) return "Choose an icon";
          if (!isNavigationIconName(icon.name)) {
            return "Choose an icon from the icon picker";
          }
          if (!icon.svg) {
            return "Re-pick this icon so its artwork is stored with the document";
          }
          return true;
        }),
    }),
    defineField({
      name: "title",
      type: "string",
      description: "A short heading beside this row’s supporting text.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      description: "Supporting points or paragraphs shown in the order listed here.",
      of: [rowItem],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "object",
      description: "Optional. Shown under the points when both fields are set.",
      fields: [
        defineField({
          name: "text",
          title: "Link Text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "url",
          title: "Destination",
          type: "customUrl",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
  ],
  preview: {
    select: { icon: "icon.name", items: "items", title: "title" },
    prepare: ({ icon, items, title }) => {
      const count = Array.isArray(items) ? items.length : 0;
      return {
        title: title || "Untitled Row",
        subtitle: `${count} ${count === 1 ? "item" : "items"}`,
        media: icon ? createNavigationIconPreview(icon) : undefined,
      };
    },
  },
});

export default defineType({
  name: "stackedFeatureRows",
  title: "Stacked Feature Rows",
  type: "object",
  icon: Rows3,
  description:
    "An introduction followed by full-width rows with supporting points and links.",
  fields: [
    sectionBackgroundField,
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Optional short label shown above the heading.",
    }),
    defineField({
      name: "title",
      title: "Heading",
      type: "minimalRichText",
      description: "Use italic for the phrase that gets the handwritten style.",
      validation: (rule) => rule.required().max(1),
    }),
    defineField({
      name: "rows",
      type: "array",
      description: "Rows are shown in the order listed here.",
      of: [row],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { eyebrow: "eyebrow", rows: "rows" },
    prepare: ({ eyebrow, rows }) => {
      const count = Array.isArray(rows) ? rows.length : 0;
      return {
        title: eyebrow || "Stacked Feature Rows",
        subtitle: `${count} ${count === 1 ? "row" : "rows"}`,
      };
    },
  },
});
