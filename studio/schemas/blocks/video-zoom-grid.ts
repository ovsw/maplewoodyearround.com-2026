import { sectionBackgroundField } from "./shared/section-background";
import { defineField, defineType } from "sanity";
import {
  sectionTitleField,
  sectionDescriptionField,
  sectionActionsField,
  sectionVideoFields,
} from "./shared/maplewood-fields";

export default defineType({
  name: "videoZoomGrid",
  title: "Video zoom grid",
  type: "object",
  fields: [
    sectionBackgroundField,
    sectionTitleField,
    defineField({
      name: "highlightText",
      title: "Highlighted words",
      type: "string",
    }),
    sectionDescriptionField,
    sectionActionsField,
    ...sectionVideoFields,
    defineField({
      name: "gridImages",
      title: "Desktop grid images",
      type: "array",
      description:
        "Eight images around the centre video, in the legacy grid order.",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              title: "Image description",
              type: "string",
              description: "Describe meaningful image content.",
            },
          ],
        },
      ],
      validation: (rule) => rule.required().length(8),
    }),
    defineField({
      name: "mobileImages",
      title: "Mobile grid images",
      type: "array",
      description: "Two images above and below the video on small screens.",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              title: "Image description",
              type: "string",
              description: "Describe meaningful image content.",
            },
          ],
        },
      ],
      validation: (rule) => rule.required().length(2),
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Video zoom grid",
      subtitle: "Video zoom grid",
    }),
  },
});
