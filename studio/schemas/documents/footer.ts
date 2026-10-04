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
      description: "The text visitors see on the link.",
      name: "label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      description: "The page, website or file this link opens.",
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
      description:
        "The image shown with this item. Set the crop and focal point.",
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
      description:
        "Optional link. Leave empty for an unlinked accreditation mark.",
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
      description: "Choose the symbol shown beside this item.",
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
      description: "The page, website or file this link opens.",
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
      description: "The heading shown above these links.",
      name: "heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      description: "Add and order the links in this group.",
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
      name: "newsletter",
      title: "Newsletter",
      type: "object",
      group: "content",
      description:
        "The heading, prompt and status messages for the newsletter form.",
      fields: [
        defineField({
          name: "heading",
          title: "Heading",
          type: "string",
          description: "The title above the signup form.",
        }),
        defineField({
          name: "description",
          title: "Introduction",
          type: "text",
          description: "The explanation shown with the signup form.",
        }),
        defineField({
          name: "successMessage",
          title: "Success message",
          type: "string",
          description: "Shown after a successful signup.",
        }),
        defineField({
          name: "errorMessage",
          title: "Error message",
          type: "string",
          description: "Shown when the signup cannot be sent.",
        }),
      ],
    }),
    defineField({
      description: "The previous footer introduction, kept for reference.",
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
      description:
        "Optional source sign-off text. Leave empty when the site footer does not use it.",
    }),
    defineField({
      name: "heading",
      title: "Closing heading",
      type: "string",
      group: "signoff",
      description:
        "Optional source sign-off text. Leave empty when the site footer does not use it.",
    }),
    defineField({
      name: "accent",
      title: "Closing emphasis",
      type: "string",
      group: "signoff",
      description:
        "Optional source sign-off text. Leave empty when the site footer does not use it.",
    }),
    defineField({
      description: "Add and order the main action links.",
      name: "actions",
      title: "Calls to action",
      type: "array",
      group: "signoff",
      of: [defineArrayMember({ type: "footerLink" })],
      validation: (rule) => rule.max(2).unique(),
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
      description:
        "Legacy fallback. Edit the current contact details in Global Settings.",
      name: "contactLinks",
      title: "Contact information (legacy)",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "footerContactLink" })],
      validation: (rule) => rule.unique(),
      deprecated: { reason: "Use contact details in Global Settings." },
      readOnly: true,
      hidden: ({ value }) => value === undefined,
    }),
    defineField({
      description: "Add and order the footer link groups.",
      name: "columns",
      title: "Navigation columns",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "footerColumn" })],
      validation: (rule) => rule.required().min(1).max(4),
    }),
    defineField({
      description: "Links to privacy, terms and other legal pages.",
      name: "legalLinks",
      title: "Legal links",
      type: "array",
      group: "legal",
      of: [defineArrayMember({ type: "footerLink" })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      description: "The first year shown in the copyright notice.",
      name: "copyrightStartYear",
      title: "Copyright start year",
      type: "number",
      group: "legal",
      validation: (rule) => rule.required().integer().min(1900),
    }),
    defineField({
      description: "The organization name and notice shown after the year.",
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
