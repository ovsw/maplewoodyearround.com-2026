import { defineArrayMember, defineField, defineType } from "sanity";
import { programOptions } from "../../documents/maplewood-fields";

export const sectionDescriptionField = defineField({
  name: "description",
  title: "Introduction",
  type: "text",
  rows: 3,
  description: "Optional text displayed below the section heading.",
});

export const sectionTitleField = defineField({
  name: "title",
  title: "Heading",
  type: "string",
  description: "The visible heading for this section.",
});

export const programFilterField = defineField({
  name: "program",
  title: "Program filter",
  type: "string",
  description: "Show only this part of Maplewood. Leave empty to show both.",
  options: { list: programOptions },
});

export const sectionActionsField = defineField({
  name: "actions",
  title: "Buttons",
  type: "array",
  description:
    "Optional calls to action. A button without a destination is hidden.",
  of: [defineArrayMember({ type: "contentAction" })],
});

export const contentAction = defineType({
  name: "contentAction",
  title: "Button or link",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Link text",
      type: "string",
      description: "The words visitors click.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "destination",
      title: "Destination",
      type: "contentDestination",
      description: "Choose an internal page, external URL or file.",
    }),
  ],
  preview: { select: { title: "label" } },
});

export const collectionSourceField = defineField({
  name: "source",
  title: "Items to show",
  type: "string",
  description:
    "Choose the collection for this section. The filters below select its items.",
  options: {
    list: [
      { title: "Activities", value: "activity" },
      { title: "Facilities", value: "facility" },
      { title: "Sample schedule", value: "sampleSchedule" },
      { title: "Playground characters", value: "playgroundCharacter" },
      { title: "Playground guests", value: "playgroundGuest" },
      { title: "Playground calendar days", value: "playgroundEvent" },
      { title: "Playground calendar PDFs", value: "playgroundCalendar" },
    ],
  },
  validation: (rule) => rule.required(),
});

export const collectionFilterFields = [
  programFilterField,
  defineField({
    name: "facilityCategory",
    title: "Facility category filter",
    type: "reference",
    to: [{ type: "facilityCategory" }],
    description: "For facilities: show only this category.",
  }),
  defineField({
    name: "activityCategory",
    title: "Activity category filter",
    type: "reference",
    to: [{ type: "activityCategory" }],
    description: "For activities: show only this category.",
  }),
  defineField({
    name: "location",
    title: "Location filter",
    type: "string",
    description:
      "For activities and facilities: show only this location group.",
    options: { list: ["Indoor", "Outdoor", "Special"] },
  }),
  defineField({
    name: "audience",
    title: "Sample schedule filter",
    type: "string",
    description:
      "For sample schedules: use the exact program or age-group label.",
  }),
  defineField({
    name: "programOffering",
    title: "School Year program filter",
    type: "reference",
    to: [{ type: "programOffering" }],
    description: "For activities: show items offered by this program.",
  }),
];

export const sectionVideoFields = [
  defineField({
    name: "videoMp4",
    title: "MP4 video",
    type: "file",
    description: "Upload the background video to Sanity.",
    options: { accept: "video/mp4" },
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: "videoWebm",
    title: "WebM video",
    type: "file",
    description: "Optional WebM copy of the same background video.",
    options: { accept: "video/webm" },
  }),
  defineField({
    name: "poster",
    title: "Still image",
    type: "image",
    description:
      "Shown before playback and when a visitor requests reduced motion.",
    options: { hotspot: true },
    validation: (rule) => rule.required(),
    fields: [
      defineField({
        name: "alt",
        title: "Image description",
        type: "string",
        description:
          "Describe meaningful content, or leave empty for decoration.",
      }),
    ],
  }),
];

export const embedUrlField = defineField({
  name: "embedUrl",
  title: "Embed URL",
  type: "url",
  description:
    "The HTTPS embed address supplied by Cognito, Airtable, Events Calendar or the map provider. Do not paste script or iframe code.",
  validation: (rule) => rule.uri({ scheme: ["https"] }),
});

export const contentCard = defineType({
  name: "contentCard",
  title: "Card",
  type: "object",
  fields: [
    sectionTitleField,
    sectionDescriptionField,
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      description: "Optional card image.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Image description",
          type: "string",
          description: "Describe meaningful image content.",
        }),
      ],
    }),
    defineField({
      name: "body",
      title: "Details",
      type: "richTextContent",
      description: "Additional paragraphs, lists and links on this card.",
    }),
    sectionActionsField,
  ],
  preview: { select: { title: "title", media: "image" } },
});

export const contentCardsField = defineField({
  name: "cards",
  title: "Cards",
  type: "array",
  description: "Cards in their display order.",
  of: [defineArrayMember({ type: "contentCard" })],
});
