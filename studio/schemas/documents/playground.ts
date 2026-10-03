import { defineField, defineType } from "sanity";
import {
  contentPreview,
  imageField,
  orderField,
  referenceField,
  slugField,
  switchField,
  textField,
  titleField,
  visibleField,
} from "./maplewood-fields";

export const playgroundCharacter = defineType({
  name: "playgroundCharacter",
  title: "Playground character",
  type: "document",
  fields: [titleField, slugField, imageField(), orderField, visibleField],
  preview: contentPreview,
});

export const playgroundGuest = defineType({
  name: "playgroundGuest",
  title: "Playground guest",
  type: "document",
  fields: [
    titleField,
    slugField,
    imageField(),
    textField(
      "time",
      "Time",
      "The guest's visit time, in the source site's wording.",
    ),
    textField(
      "subtitle",
      "Subtitle",
      "Short text shown below the guest title.",
    ),
    textField("personName", "Guest name", "The public name of the guest."),
    textField(
      "companyName",
      "Company name",
      "The organization represented by the guest.",
    ),
    defineField({
      name: "destination",
      title: "Guest link",
      type: "contentDestination",
      description: "The public website or page opened from this guest.",
    }),
  ],
  preview: contentPreview,
});

export const playgroundEvent = defineType({
  name: "playgroundEvent",
  title: "Playground calendar day",
  type: "document",
  fields: [
    titleField,
    slugField,
    defineField({
      name: "date",
      title: "Calendar date",
      type: "datetime",
      description: "The date retained from the source calendar.",
      validation: (rule) => rule.required(),
    }),
    referenceField(
      "guest",
      "Special guest",
      "playgroundGuest",
      "The guest for this calendar day.",
    ),
    referenceField(
      "character",
      "Character",
      "playgroundCharacter",
      "The character appearing on this calendar day.",
    ),
    textField(
      "dayLabel",
      "Day of the week",
      "The public day label from the calendar.",
    ),
    defineField({
      name: "agenda",
      title: "Agenda",
      type: "richTextContent",
      description: "The activities and details for this day.",
    }),
    switchField(
      "hasGuest",
      "Show special guest",
      "Show the guest information for this day.",
    ),
    switchField(
      "customDay",
      "Custom day",
      "Use this day's custom agenda instead of the regular display.",
    ),
  ],
  preview: { select: { title: "title", subtitle: "date" } },
});

export const playgroundCalendar = defineType({
  name: "playgroundCalendar",
  title: "Playground calendar PDF",
  type: "document",
  fields: [
    titleField,
    slugField,
    defineField({
      name: "file",
      title: "Calendar PDF",
      type: "file",
      description: "Upload the calendar PDF that families can download.",
      options: { accept: "application/pdf" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "effectiveFrom",
      title: "Effective from",
      type: "datetime",
      description: "The date from which this calendar applies.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: "title", subtitle: "effectiveFrom" } },
});
