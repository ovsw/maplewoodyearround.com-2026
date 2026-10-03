import { defineField, defineType } from "sanity";
import { InlineObjectField } from "../../inputs/inline-object-field";

import { validateDestinationUrl } from "../../validation/destination-url";

export default defineType({
  name: "customUrl",
  title: "URL",
  type: "object",
  // The type radio, page reference, and URL field read fine on their own; the
  // fieldset frame only nests the form one level deeper.
  components: { field: InlineObjectField },
  fields: [
    defineField({
      name: "file", title: "File", type: "file",
      description: "Upload a document to link to it. Replace the asset here when it changes.",
      hidden: ({ parent }) => parent?.type !== "file",
      validation: (rule) => rule.custom((value, context) =>
        (context.parent as { type?: string } | undefined)?.type === "file" && !value?.asset?._ref
          ? "Upload a file" : true),
    }),
    defineField({
      name: "external",
      title: "External URL",
      type: "string",
      hidden: ({ parent }) => parent?.type !== "external",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { type?: string } | undefined;
          return parent?.type === "external" ? validateDestinationUrl(value) : true;
        }),
    }),
    defineField({
      name: "internal",
      title: "Internal Page",
      type: "reference",
      to: [
        { type: "homePage" },
        { type: "parentDashboard" },
        { type: "blogIndex" },
        { type: "page" },
        { type: "post" },
      ],
      hidden: ({ parent }) => parent?.type !== "internal",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { type?: string } | undefined;
          return parent?.type === "internal" && !value
            ? "Select the internal page"
            : true;
        }),
    }),
    defineField({
      name: "type",
      type: "string",
      initialValue: "internal",
      options: {
        layout: "radio",
        direction: "horizontal",
        list: [
          { title: "Internal", value: "internal" },
          { title: "External", value: "external" },
          { title: "File", value: "file" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "openInNewTab",
      title: "Open in new tab",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "href",
      type: "string",
      hidden: true,
      readOnly: true,
    }),
  ],
});
