import { LinkIcon, Menu, PanelsTopLeft, Sparkles } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import NavigationIconInput, {
  createNavigationIconPreview,
} from "../inputs/navigation-icon-input";
import { isNavigationIconName } from "../inputs/lucide-icon-catalog";
import { defineDestinationType } from "../blocks/shared/destination";

const destination = defineDestinationType({
  name: "navigationDestination",
  externalTitle: "A URL",
  externalFieldTitle: "URL or root-relative path",
});

const navigationIcon = defineField({
  name: "icon",
  title: "Icon",
  type: "object",
  description: "Optional. Choose an icon for a grouped navigation link.",
  components: {
    input: NavigationIconInput,
  },
  fields: [
    defineField({
      description: "The public name shown with this item.",
      name: "name",
      title: "Name",
      type: "string",
    }),
    // The icon's SVG markup, captured at pick time so the frontend can
    // render it without bundling the full Lucide icon set.
    defineField({
      description: "Saved artwork for the chosen icon.",
      name: "svg",
      title: "SVG markup",
      type: "string",
      hidden: true,
    }),
  ],
  validation: (rule) =>
    rule.custom((value) => {
      const icon = value as { name?: string; svg?: string } | undefined;
      if (!icon?.name) return true;
      if (!isNavigationIconName(icon.name)) {
        return "Choose an icon from the navigation icon picker";
      }
      if (!icon.svg) {
        return "Re-pick this icon so its artwork is stored with the document";
      }
      return true;
    }),
});

const childLink = defineType({
  name: "navigationChildLink",
  title: "Rich navigation link",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({
      description: "The text visitors see on the link.",
      name: "label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "string",
      description: "Optional context shown in a grouped navigation menu.",
    }),
    navigationIcon,
    defineField({
      description: "The page, website or file this link opens.",
      name: "destination",
      type: "navigationDestination",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { icon: "icon.name", title: "label", subtitle: "description" },
    prepare: ({ icon, title, subtitle }) => ({
      title,
      subtitle,
      media: icon ? createNavigationIconPreview(icon) : undefined,
    }),
  },
});

const directLink = defineType({
  name: "navigationLink",
  title: "Direct link",
  type: "object",
  icon: LinkIcon,
  fields: [
    navigationIcon,
    defineField({
      name: "accent",
      title: "Link color",
      type: "string",
      description: "Choose the source color for this large menu link.",
      options: { list: ["none", "yellow", "mint", "purple", "blue", "red"] },
    }),
    defineField({
      description: "The text visitors see on the link.",
      name: "label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      description: "The page, website or file this link opens.",
      name: "destination",
      type: "navigationDestination",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: "label" } },
});

const group = defineType({
  name: "navigationGroup",
  title: "Link group",
  type: "object",
  icon: PanelsTopLeft,
  fields: [
    defineField({
      name: "destination",
      title: "Group heading link",
      type: "navigationDestination",
      description: "Optional page opened by the group heading.",
    }),
    defineField({
      description: "The text visitors see on the link.",
      name: "label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      description: "Add and order the links in this group.",
      name: "links",
      type: "array",
      of: [defineArrayMember({ type: "navigationChildLink" })],
      validation: (rule) => rule.required().min(1).unique(),
    }),
  ],
  preview: {
    select: { title: "label", links: "links" },
    prepare: ({ title, links = [] }) => ({
      title,
      subtitle: `${links.length} link${links.length === 1 ? "" : "s"}`,
    }),
  },
});

const action = defineType({
  name: "navigationAction",
  title: "Navigation action",
  type: "object",
  icon: Sparkles,
  fields: [
    defineField({
      description: "The text visitors see on the link.",
      name: "label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      description: "The page, website or file this link opens.",
      name: "destination",
      type: "navigationDestination",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: "label" } },
});

const navigation = defineType({
  name: "navigation",
  title: "Site Navigation",
  type: "document",
  icon: Menu,
  fields: [
    defineField({
      description: "Add and order the main menu links and groups.",
      name: "items",
      title: "Primary navigation",
      type: "array",
      of: [
        defineArrayMember({ type: "navigationLink" }),
        defineArrayMember({ type: "navigationGroup" }),
      ],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: "actions",
      title: "Calls to action",
      type: "array",
      description: "Up to two links shown beside the main menu.",
      of: [defineArrayMember({ type: "navigationAction" })],
      validation: (rule) => rule.unique().max(2),
    }),
  ],
  preview: { prepare: () => ({ title: "Site Navigation" }) },
});

export const navigationSchemaTypes = [
  destination,
  childLink,
  directLink,
  group,
  action,
];

export default navigation;
