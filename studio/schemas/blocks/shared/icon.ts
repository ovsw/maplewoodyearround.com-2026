import { defineField } from "sanity";
import IconInput from "../../inputs/icon-input";
import { isIconName } from "../../inputs/icon-catalog";

type IconValue = { name?: string; svg?: string } | undefined;

const checkIcon = (value: unknown, required: boolean) => {
  const icon = value as IconValue;
  if (!icon?.name) return required ? "Choose an icon" : true;
  if (!isIconName(icon.name)) return "Choose an icon from the icon picker";
  if (!icon.svg) return "Re-pick this icon so its artwork is stored with the document";
  return true;
};

/** An icon from the Material two-tone set, chosen in the icon picker. */
export const iconField = defineField({
  name: "icon",
  type: "object",
  description: "Choose an icon from the picker.",
  components: { input: IconInput },
  fields: [
    defineField({ name: "name", type: "string" }),
    // The icon artwork is stored with the content, so the Website does not
    // bundle an icon set.
    defineField({
      name: "svg",
      title: "SVG markup",
      type: "string",
      hidden: true,
    }),
  ],
  validation: (rule) => rule.custom((value) => checkIcon(value, false)),
});

export const requiredIconField = defineField({
  ...iconField,
  validation: (rule) => rule.custom((value) => checkIcon(value, true)),
});
