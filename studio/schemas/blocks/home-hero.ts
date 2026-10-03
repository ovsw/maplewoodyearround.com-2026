import { Sparkles } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const homeHeroStat = defineArrayMember({
  name: "homeHeroStat",
  title: "Stat",
  type: "object",
  fields: [
    defineField({
      name: "value",
      type: "string",
      description: "The bold figure or short phrase.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      type: "string",
      description: "A one-line explanation shown under the value.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "value", subtitle: "label" },
  },
});

export default defineType({
  name: "homeHero",
  title: "Home Hero",
  type: "object",
  icon: Sparkles,
  description:
    "Full-viewport hero with background video, heading, stats bar, and call-to-action buttons. Designed for the home page.",
  fields: [
    defineField({
      name: "title",
      title: "Heading",
      type: "minimalRichText",
      description:
        "The main heading. Use italic for emphasis.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Supporting Message",
      type: "simpleRichText",
      description:
        "A short paragraph shown below the heading on desktop.",
    }),
    defineField({
      name: "shortBody",
      title: "Short Body (Mobile)",
      type: "string",
      description:
        "A shorter version of the supporting message shown on small screens. Falls back to the full body if empty.",
    }),
    defineField({
      name: "buttons",
      type: "array",
      description:
        "Up to two call-to-action buttons with their chosen styles. On phones they sit side by side above the stats bar. The film button is configured separately below.",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: "videoUrl",
      title: "Background Video URL",
      type: "url",
      description:
        "Direct link to an mp4 video file. Plays muted and looped behind the hero.",
      validation: (rule) =>
        rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "disableVideo",
      title: "Disable Background Video",
      type: "boolean",
      initialValue: false,
      description:
        "Show the background image instead of the video. Turns the video off without deleting its URL.",
    }),
    defineField({
      name: "filmButton",
      title: "Film Button",
      type: "object",
      description:
        "Opens the camp film in a lightbox. Sits on the photo on phones and next to the buttons on desktop. Leave the URL empty to hide it.",
      fields: [
        defineField({
          name: "label",
          title: "Label",
          type: "string",
          description: 'Shown next to a play icon, e.g. "Watch the film".',
        }),
        defineField({
          name: "url",
          title: "Film URL",
          type: "url",
          description: "YouTube or Vimeo link to the film.",
          validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
        }),
      ],
    }),
    defineField({
      name: "image",
      title: "Background Image",
      type: "image",
      options: { hotspot: true },
      description:
        "Serves as the video poster frame and fallback for visitors without autoplay.",
      fields: [
        defineField({
          name: "alt",
          title: "Alternative Text",
          type: "string",
          validation: (rule) =>
            rule.custom((value, context) => {
              const parent = context.parent as { asset?: unknown } | undefined;
              return parent?.asset && !value
                ? "Describe the image for visitors who cannot see it"
                : true;
            }),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "stats",
      title: "Stats Bar",
      type: "array",
      description:
        "Short facts shown at the bottom of the hero. Each has a bold value and a label.",
      of: [homeHeroStat],
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: { media: "image" },
    prepare: ({ media }) => ({
      title: "Home Hero",
      subtitle: "Home Hero",
      media,
    }),
  },
});
