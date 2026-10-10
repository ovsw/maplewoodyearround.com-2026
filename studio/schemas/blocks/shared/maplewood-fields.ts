import { defineArrayMember, defineField, defineType } from "sanity";
import { programOptions } from "../../documents/maplewood-fields";
import { createIconPreview } from "../../inputs/icon-input";
import { iconField } from "./icon";

export { iconField };

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
      { title: "Summer activities", value: "summerActivity" },
      { title: "School Year activities", value: "schoolYearActivity" },
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
    description: "For Summer activities: show only this category.",
  }),
  defineField({
    name: "grade",
    title: "Grade filter",
    type: "reference",
    to: [{ type: "grade" }],
    description: "For Summer activities: show only activities for this grade.",
  }),
  defineField({
    name: "location",
    title: "Location filter",
    type: "string",
    description:
      "For School Year activities and facilities: show only this location group.",
    options: { list: ["Indoor", "Outdoor", "Special"] },
  }),
  defineField({
    name: "sampleSchedule",
    title: "Sample schedule",
    type: "reference",
    to: [{ type: "sampleSchedule" }],
    description: "For a sample schedule: the day to show, slot by slot.",
  }),
  defineField({
    name: "programOffering",
    title: "School Year program filter",
    type: "reference",
    to: [{ type: "programOffering" }],
    description: "For School Year activities: show items offered by this program.",
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
    defineField({ name: "eyebrow", title: "Short label", type: "string" }),
    defineField({
      name: "mobileImage",
      title: "Mobile image",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Image description", type: "string" }],
    }),
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

/** The colour names the live site uses for icons, cards and highlights. */
export const accentOptions = [
  { title: "Green", value: "green" },
  { title: "Blue", value: "blue" },
  { title: "Red", value: "red" },
  { title: "Purple", value: "purple" },
  { title: "Mint", value: "mint" },
  { title: "Yellow", value: "yellow" },
];

export const accentField = defineField({
  name: "accent",
  title: "Colour",
  type: "string",
  description: "The colour of the icon and highlighted words.",
  options: { list: accentOptions },
});

/** Section label: an optional program badge followed by optional text. */
export const tagline = defineType({
  name: "tagline",
  title: "Label",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Badge text",
      type: "string",
      description:
        'Text in the coloured badge, such as "Summer Camp". Leave empty for plain text only.',
    }),
    defineField({
      name: "program",
      title: "Badge colour",
      type: "string",
      description: "The program colour of the badge.",
      options: { list: programOptions },
    }),
    defineField({
      name: "text",
      title: "Text after the badge",
      type: "string",
      description: 'For example "Swimming".',
    }),
  ],
  preview: {
    select: { label: "label", text: "text" },
    prepare: ({ label, text }) => ({
      title: [label, text].filter(Boolean).join(" – ") || "Label",
    }),
  },
});

export const taglineField = defineField({
  name: "tagline",
  title: "Label",
  type: "tagline",
  description: "Optional short label above the heading.",
});

export const sectionAnchorField = defineField({
  name: "anchorId",
  title: "Link anchor",
  type: "string",
  description:
    'Lets a link jump to this section, such as "bus-map" for #bus-map. Use lowercase letters, numbers and hyphens.',
  validation: (rule) =>
    rule.regex(/^[a-z0-9][a-z0-9-]*$/, { name: "anchor" }),
});

/** A short point with an icon, such as "Safety First" beside a story. */
export const featureItem = defineType({
  name: "featureItem",
  title: "Point",
  type: "object",
  fields: [
    iconField,
    accentField,
    defineField({
      name: "title",
      title: "Heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Text",
      type: "simpleRichText",
      description: "Bold words appear in the point's colour.",
    }),
  ],
  preview: {
    select: { title: "title", icon: "icon.svg" },
    prepare: ({ title, icon }) => ({
      title: title || "Point",
      media: icon ? createIconPreview(icon) : undefined,
    }),
  },
});

/** One step in a page's breadcrumb trail. */
export const breadcrumb = defineType({
  name: "breadcrumb",
  title: "Breadcrumb",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Text",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "destination",
      title: "Destination",
      type: "contentDestination",
      description: "Leave empty to show the text without a link.",
    }),
    defineField({
      name: "program",
      title: "Badge colour",
      type: "string",
      description: "Show this step as a program badge.",
      options: { list: programOptions },
    }),
  ],
  preview: { select: { title: "label" } },
});

export const breadcrumbsField = defineField({
  name: "breadcrumbs",
  title: "Breadcrumbs",
  type: "array",
  description: "The trail of links above the heading, in order.",
  of: [defineArrayMember({ type: "breadcrumb" })],
});

export const featureItemsField = defineField({
  name: "features",
  title: "Points",
  type: "array",
  description: "Optional short points, shown below the text.",
  of: [defineArrayMember({ type: "featureItem" })],
  validation: (rule) => rule.max(4),
});

export const highlightTextField = defineField({
  name: "highlightText",
  title: "Highlighted words",
  type: "string",
  description: "Words of the heading shown in yellow, such as “Summer Camp”.",
});
