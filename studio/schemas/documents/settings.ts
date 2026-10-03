import { Contact, Globe2, ImageIcon, Settings } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const socialLink = defineType({
  name: "socialLink",
  title: "Social link",
  type: "object",
  icon: Globe2,
  fields: [
    defineField({
      name: "label",
      type: "string",
      description: "The network or community name shown to visitors.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "url",
      type: "url",
      validation: (rule) =>
        rule.required().uri({ scheme: ["http", "https"] }),
    }),
  ],
  preview: { select: { title: "label", subtitle: "url" } },
});

const contactDetails = defineType({
  name: "contactDetails",
  title: "Contact details",
  type: "object",
  icon: Contact,
  fields: [
    defineField({ name: "email", type: "email" }),
    defineField({
      name: "phone",
      type: "string",
      description: "Include the country or area code visitors should dial.",
    }),
    defineField({
      name: "addressLines",
      title: "Address",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.max(4),
    }),
  ],
});

const settings = defineType({
  name: "settings",
  title: "Global Settings",
  type: "document",
  icon: Settings,
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "contact", title: "Contact" },
    { name: "seo", title: "Search & sharing" },
  ],
  fields: [
    defineField({
      name: "siteName",
      title: "Site name",
      type: "string",
      group: "identity",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "object",
      icon: ImageIcon,
      group: "identity",
      description:
        "Optional. When no logo is supplied, the header uses the site name as text.",
      fields: [
        defineField({
          name: "light",
          title: "For light backgrounds",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({
          name: "dark",
          title: "For dark backgrounds",
          type: "image",
          options: { hotspot: true },
        }),
      ],
    }),
    defineField({
      name: "contact",
      type: "contactDetails",
      group: "contact",
    }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      group: "contact",
      of: [defineArrayMember({ type: "socialLink" })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "seoDescription",
      title: "Site-wide description",
      type: "text",
      rows: 3,
      group: "seo",
      description:
        "Optional. The last fallback for search results and shared links, used when a page has neither an SEO description nor a content description.",
    }),
    defineField({
      name: "seoImage",
      title: "Site sharing image",
      type: "image",
      group: "seo",
      description:
        "Optional. Shown on shared links when a page has no Social sharing image override and its Generated sharing card is unavailable. Shared links show this image at 1200 × 630, so set the crop and hotspot to keep the important part visible.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
          description:
            "Optional. Describes the image for people who cannot see it. When empty, the page title is used.",
        }),
      ],
    }),
  ],
  preview: {
    select: { media: "logo.light", title: "siteName" },
    prepare: ({ media, title }) => ({
      title: title || "Global Settings",
      subtitle: "Site identity and contact details",
      media,
    }),
  },
});

export const settingsSchemaTypes = [socialLink, contactDetails];

export default settings;
