import { defineField, defineType } from "sanity";
import { InlineObjectField } from "../../inputs/inline-object-field";

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
 * Stored shape: { kind: "internal" | "external", internal?, external?, openInNewTab }.
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
        initialValue: "internal",
        options: {
          layout: "radio",
          direction: "horizontal",
          list: [
            { title: "A page on this site", value: "internal" },
            { title: externalTitle, value: "external" },
          ],
        },
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: "internal",
        title: "Page",
        type: "reference",
        to: [
          { type: "homePage" },
          { type: "page" },
          { type: "post" },
          { type: "category" },
          { type: "blogIndex" },
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
        hidden: ({ parent }) => parent?.kind !== "external",
        validation: (rule) =>
          rule.custom((value, context) => {
            if (
              (context.parent as { kind?: string } | undefined)?.kind !==
              "external"
            ) {
              return true;
            }
            if (!value) return "Enter a destination";
            return /^(https?:\/\/|mailto:|tel:|\/)/.test(value)
              ? true
              : "Use an absolute URL, mailto:, tel:, or a root-relative path";
          }),
      }),
      defineField({
        name: "openInNewTab",
        title: "Open in a new tab",
        type: "boolean",
        initialValue: false,
      }),
    ],
    validation: (rule) => rule.required(),
  });
}
