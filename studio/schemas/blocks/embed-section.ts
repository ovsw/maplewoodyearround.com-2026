import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
  sectionActionsField,
  embedUrlField,
  sectionAnchorField,
  taglineField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "embedSection",
  title: "Embedded content",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    taglineField,
    sectionTitleField,
    sectionDescriptionField,
    defineField({
      name: "body",
      title: "Text",
      type: "basicRichText",
      description: "Optional paragraphs and lists shown before the embed.",
    }),
    embedUrlField,
    defineField({
      name: "sentFrom",
      title: "Tour program",
      type: "string",
      description:
        "The Cognito SentFrom value from the source tour page. Leave empty for other embeds.",
    }),
    defineField({
      name: "providerId",
      title: "Form or calendar ID",
      type: "string",
      description:
        "The public form or calendar identifier supplied with the source embed. Never enter an API key.",
    }),
    defineField({
      name: "accountId",
      title: "Public account identifier",
      type: "string",
      description:
        "The public Cognito account identifier when the form's embed needs it. Never enter a secret.",
    }),
    defineField({
      name: "frameTitle",
      title: "Embed description",
      type: "string",
      description: "A short name announced to screen-reader users.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "provider",
      title: "Provider",
      type: "string",
      description: "The service supplying this embedded content.",
      options: {
        list: ["Cognito", "Airtable", "Events Calendar", "Map", "Other"],
      },
    }),
    sectionActionsField,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Embedded content",
      subtitle: "Embedded content",
    }),
  },
});
