import {
  Columns3,
  ImageIcon,
  Link,
  Mail,
  MapPin,
  PanelBottom,
  Phone,
} from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { defineDestinationType } from "../blocks/shared/destination";

const destination = defineDestinationType({
  name: "footerDestination",
  externalTitle: "A URL, phone, or email",
  externalFieldTitle: "URL, phone, email, or root-relative path",
});

const footerLink = defineType({
  name: "footerLink",
  title: "Footer link",
  type: "object",
  icon: Link,
  fields: [
    defineField({
      name: "label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "destination",
      type: "footerDestination",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: "label" } },
});

const footerLogo = defineType({
  name: "footerLogo",
  title: "Footer logo",
  type: "object",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "alt",
      title: "Alternative text",
      type: "string",
      description: "Name the organization represented by the logo.",
    }),
    defineField({
      name: "destination",
      type: "footerDestination",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { media: "image", title: "alt" } },
});

const contactIcons = [
  { title: "Address", value: "pin", icon: MapPin },
  { title: "Phone", value: "phone", icon: Phone },
  { title: "Email", value: "email", icon: Mail },
] as const;

const footerContactLink = defineType({
  name: "footerContactLink",
  title: "Contact link",
  type: "object",
  icon: MapPin,
  fields: [
    defineField({
      name: "icon",
      type: "string",
      options: {
        layout: "radio",
        list: contactIcons.map(({ title, value }) => ({ title, value })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      type: "text",
      rows: 2,
      description: "Press Enter to show this link on more than one line.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "destination",
      type: "footerDestination",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { icon: "icon", title: "label" },
    prepare: ({ icon, title }) => ({
      title: title?.replace(/\n/g, " "),
      media: contactIcons.find((item) => item.value === icon)?.icon,
    }),
  },
});

const footerColumn = defineType({
  name: "footerColumn",
  title: "Footer column",
  type: "object",
  icon: Columns3,
  fields: [
    defineField({
      name: "heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "links",
      type: "array",
      of: [defineArrayMember({ type: "footerLink" })],
      validation: (rule) => rule.required().min(1).unique(),
    }),
  ],
  preview: {
    select: { title: "heading", links: "links" },
    prepare: ({ title, links }) => ({
      title,
      subtitle: `${links?.length ?? 0} link${links?.length === 1 ? "" : "s"}`,
    }),
  },
});

const footer = defineType({
  name: "footer",
  title: "Site Footer",
  type: "document",
  icon: PanelBottom,
  groups: [
    { name: "signoff", title: "Sign-off", default: true },
    { name: "content", title: "Links and contact" },
    { name: "legal", title: "Legal" },
  ],
  fields: [
    defineField({
      name: "intro",
      title: "Introduction (deprecated)",
      type: "text",
      deprecated: {
        reason: "The new footer sign-off replaces this introduction.",
      },
      readOnly: true,
      hidden: ({ value }) => value === undefined,
      initialValue: undefined,
    }),
    defineField({
      name: "eyebrow",
      title: "Location line",
      type: "string",
      group: "signoff",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heading",
      title: "Closing heading",
      type: "string",
      group: "signoff",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "accent",
      title: "Closing emphasis",
      type: "string",
      group: "signoff",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "actions",
      title: "Calls to action",
      type: "array",
      group: "signoff",
      of: [defineArrayMember({ type: "footerLink" })],
      validation: (rule) => rule.required().min(1).max(2).unique(),
    }),
    defineField({
      name: "logos",
      title: "Footer logos",
      type: "array",
      group: "content",
      description: "The site logo and affiliated association marks.",
      of: [defineArrayMember({ type: "footerLogo" })],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: "contactLinks",
      title: "Contact information",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "footerContactLink" })],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: "columns",
      title: "Navigation columns",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "footerColumn" })],
      validation: (rule) => rule.required().min(1).max(4),
    }),
    defineField({
      name: "legalLinks",
      title: "Legal links",
      type: "array",
      group: "legal",
      of: [defineArrayMember({ type: "footerLink" })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "copyrightStartYear",
      title: "Copyright start year",
      type: "number",
      group: "legal",
      validation: (rule) => rule.required().integer().min(1900),
    }),
    defineField({
      name: "copyrightOwner",
      title: "Copyright owner and notice",
      type: "string",
      group: "legal",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Site Footer" }) },
});

export const footerSchemaTypes = [
  destination,
  footerLink,
  footerLogo,
  footerContactLink,
  footerColumn,
];

export default footer;
