import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
  sectionActionsField,
  sectionAnchorField,
  contentCardsField,
} from "./shared/maplewood-fields";

export default defineType({
  name: "busMap",
  title: "Bus map and benefits",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionAnchorField,
    sectionTitleField,
    defineField({ name: "eyebrow", title: "Short label", type: "string" }),
    sectionDescriptionField,
    contentCardsField,
    sectionActionsField,
    defineField({
      name: "showStopList",
      title: "Show the stop list",
      type: "boolean",
      description:
        "Shows every Bus stop under the map, folded closed and grouped by town. Turn it on only on the Free Bus Transportation page.",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Bus map and benefits",
      subtitle: "Bus map and benefits",
    }),
  },
});
