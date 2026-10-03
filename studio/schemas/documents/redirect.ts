import { TrendingUpDown } from "lucide-react";
import { defineField, defineType } from "sanity";

import { getPresentationPath } from "../../presentation/routes";
import {
  validateRedirectDestinationReference,
  validateRedirectSource,
} from "../validation/redirect-rules";

export default defineType({
  name: "redirect",
  title: "Redirect",
  type: "document",
  icon: TrendingUpDown,
  description:
    "Send an old internal path to a current one after the next frontend build.",
  fields: [
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      description: "Enable or disable this redirect.",
      options: {
        list: [
          { title: "Active", value: "active" },
          { title: "Inactive", value: "inactive" },
        ],
        layout: "radio",
      },
      initialValue: "active",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "source",
      title: "Source",
      type: "slug",
      description: "The old internal path, starting with /.",
      validation: (Rule) => [
        Rule.required(),
        Rule.custom(validateRedirectSource),
      ],
    }),
    defineField({
      name: "destinationReference",
      title: "Destination",
      type: "reference",
      description: "Select the published page visitors should reach.",
      to: [
        { type: "homePage" },
        { type: "page" },
        { type: "post" },
        { type: "category" },
        { type: "blogIndex" },
      ],
      validation: (Rule) =>
        Rule.required().custom(validateRedirectDestinationReference),
    }),
    defineField({
      name: "destination",
      title: "Destination path (legacy)",
      type: "slug",
      deprecated: {
        reason: "Redirect destinations now use the Destination page selector.",
      },
      readOnly: true,
      hidden: ({ document, value }) =>
        !value || Boolean(document?.destinationReference),
      initialValue: undefined,
    }),
    defineField({
      name: "permanent",
      title: "Redirect type",
      type: "string",
      description: "Use 301 for a permanent move or 302 for a temporary one.",
      options: {
        list: [
          { title: "Permanent (301)", value: "true" },
          { title: "Temporary (302)", value: "false" },
        ],
        layout: "radio",
      },
      initialValue: "true",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      destinationId: "destinationReference._id",
      destinationSlug: "destinationReference.slug.current",
      destinationType: "destinationReference._type",
      legacyDestination: "destination.current",
      permanent: "permanent",
      source: "source.current",
      status: "status",
    },
    prepare: ({
      destinationId,
      destinationSlug,
      destinationType,
      legacyDestination,
      permanent,
      source,
      status,
    }) => {
      const destination =
        getPresentationPath(
          destinationType,
          destinationSlug ??
            (destinationId === "homePage" || destinationId === "blogIndex"
              ? null
              : undefined),
        ) ?? legacyDestination;

      return {
        title: `${source || "Untitled"} → ${destination || "Untitled"}`,
        subtitle: `${permanent === "false" ? "302 temporary" : "301 permanent"}, ${status || "inactive"}`,
        media: TrendingUpDown,
      };
    },
  },
});
