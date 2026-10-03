import { LayoutGrid } from "lucide-react";
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

const benefitCard = defineArrayMember({
  name: "featureGridItem",
  title: "Feature",
  type: "object",
  fields: [
    defineField({
      name: "icon",
      title: "Icon",
      type: "object",
      description: "Choose an icon that helps identify this feature.",
      components: {
        input: NavigationIconInput,
      },
      fields: [
        defineField({ name: "name", title: "Name", type: "string" }),
        // The icon's SVG markup, captured at pick time so the frontend can
        // render it without bundling the full Lucide icon set.
        defineField({ name: "svg", title: "SVG markup", type: "string", hidden: true }),
      ],
      validation: (rule) =>
        rule.custom((value) => {
          const icon = value as { name?: string; svg?: string } | undefined;
          if (!icon?.name) return true;
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
      description: "The heading shown for this feature.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "simpleRichText",
      description:
        "A short explanation. Paragraphs support bold, italic, and links.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { icon: "icon.name", title: "title" },
    prepare: ({ icon, title }) => ({
      title: title || "Untitled Card",
      subtitle: "Feature",
      media: icon ? createNavigationIconPreview(icon) : undefined,
    }),
  },
});

export default defineType({
  name: "benefitCards",
  title: "Feature Grid",
  type: "object",
  icon: LayoutGrid,
  description:
    "A reusable grid for features, services, reasons, or benefits.",
  fields: [
    sectionBackgroundField,
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Optional text shown above the section title",
    }),
    defineField({
      name: "title",
      title: "Heading",
      type: "minimalRichText",
      description: "Use italic for the phrase that gets the handwritten style.",
      validation: (rule) => rule.required().max(1),
    }),
    defineField({
      name: "intro",
      type: "text",
      rows: 4,
      description: "Optional paragraph shown under the section heading",
    }),
    defineField({
      name: "cards",
      title: "Features",
      type: "array",
      description:
        "Add up to 6 feature items. They are shown in the order listed here.",
      of: [benefitCard],
      validation: (rule) => rule.required().min(1).max(6),
    }),
  ],
  preview: {
    select: { title: "title", cards: "cards" },
    prepare: ({ title, cards }) => {
      const count = Array.isArray(cards) ? cards.length : 0;
      return {
        title: richTextToPlainText(title) || "Untitled Feature Grid",
        subtitle: `Feature Grid - ${count} ${count === 1 ? "feature" : "features"}`,
      };
    },
  },
});
