import { defineField, defineType } from "sanity";
import { InlineObjectField } from "../../inputs/inline-object-field";
import { validateDestinationUrl } from "../../validation/destination-url";

type DestinationOptions = {
  name: string;
  /** Radio label for the non-reference choice. */
  externalTitle: string;
  /** Title of the free-text destination field. */
  externalFieldTitle: string;
};

/**
 * A link target: either a reference to a site document or a typed URL. The
 * navigation and footer each store their own copy of this object type (their
 * `_type` values are already in the dataset), so they share this definition
 * instead of two hand-maintained ones.
 *
 * Stored shape: { kind: "internal" | "external" | "file", internal?, external?, file?, openInNewTab }.
 */
export function defineDestinationType({
  name,
  externalTitle,
  externalFieldTitle,
}: DestinationOptions) {
  return defineType({
    name,
    title: "Destination",
    type: "object",
    // The fields below read fine on their own; the fieldset frame only nests
    // the form one level deeper.
    components: { field: InlineObjectField },
    fields: [
      defineField({
        name: "kind",
        title: "Links to",
        type: "string",
        description:
          "Choose a website page, another website, or an uploaded file.",
        initialValue: "internal",
        options: {
          layout: "radio",
          direction: "horizontal",
          list: [
            { title: "A page on this site", value: "internal" },
            { title: externalTitle, value: "external" },
            { title: "A file", value: "file" },
          ],
        },
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: "internal",
        title: "Page",
        type: "reference",
        description: "The page opened by this link.",
        to: [
          { type: "homePage" },
          { type: "page" },
          { type: "post" },
          { type: "category" },
          { type: "blogIndex" },
          { type: "parentDashboard" },
        ],
        hidden: ({ parent }) => parent?.kind !== "internal",
        validation: (rule) =>
          rule.custom((value, context) =>
            (context.parent as { kind?: string } | undefined)?.kind ===
              "internal" && !value
              ? "Select a page"
              : true,
          ),
      }),
      defineField({
        name: "external",
        title: externalFieldTitle,
        type: "string",
        description:
          "Use a full URL, public email or phone link, or a path on this site.",
        hidden: ({ parent }) => parent?.kind !== "external",
        validation: (rule) =>
          rule.custom((value, context) => {
            if (
              (context.parent as { kind?: string } | undefined)?.kind !==
              "external"
            ) {
              return true;
            }
            return validateDestinationUrl(value);
          }),
      }),
      defineField({
        name: "file",
        title: "File",
        type: "file",
        description:
          "Upload the document visitors download. Replace it here when it changes.",
        hidden: ({ parent }) => parent?.kind !== "file",
        validation: (rule) =>
          rule.custom((value, context) =>
            (context.parent as { kind?: string } | undefined)?.kind ===
              "file" && !value?.asset?._ref
              ? "Upload a file"
              : true,
          ),
      }),
      defineField({
        name: "openInNewTab",
        title: "Open in a new tab",
        type: "boolean",
        initialValue: false,
        description: "Open this destination in a new browser tab.",
      }),
    ],
  });
}
