import { CalendarClock } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import {
  descriptionField,
  imageField,
  programField,
  titleField,
} from "./maplewood-fields";

const API_VERSION = "2026-03-23";

/** The activity type of each side. A slot can only name an activity of its schedule's side. */
const ACTIVITY_TYPE = {
  summerCamp: "summerActivity",
  schoolYear: "schoolYearActivity",
} as const;

type Side = keyof typeof ACTIVITY_TYPE;
type Reference = { _ref?: string };

const sideOf = (document: unknown) =>
  (document as { program?: Side } | undefined)?.program;

export const sampleScheduleSlot = defineType({
  name: "sampleScheduleSlot",
  title: "Time slot",
  type: "object",
  fields: [
    defineField({
      name: "time",
      title: "Time",
      type: "string",
      description: 'When this happens, such as "9:30–10".',
    }),
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description:
        "What visitors read for this slot: an activity or a routine such as Lunch or Roundup.",
      validation: (rule) => rule.required().error("Enter the label."),
    }),
    defineField({
      name: "activity",
      title: "Activity",
      type: "reference",
      to: [{ type: "summerActivity" }, { type: "schoolYearActivity" }],
      description:
        "Optional. The activity this slot is about, from the same side as the schedule.",
      options: {
        filter: ({ document }) => ({
          filter: "_type == $type",
          params: { type: ACTIVITY_TYPE[sideOf(document) ?? "summerCamp"] },
        }),
      },
      validation: (rule) =>
        rule.custom(async (value: Reference | undefined, context) => {
          const side = sideOf(context.document);
          if (!value?._ref || !side) return true;
          const type = await context
            .getClient({ apiVersion: API_VERSION })
            .fetch<string | null>("*[_id in [$id, 'drafts.' + $id]][0]._type", {
              id: value._ref,
            });
          return !type || type === ACTIVITY_TYPE[side]
            ? true
            : "Choose an activity of the same side as the schedule.";
        }),
    }),
    descriptionField(),
    imageField(),
  ],
  preview: {
    select: { title: "label", subtitle: "time", media: "image" },
  },
});

export default defineType({
  name: "sampleSchedule",
  title: "Sample schedule",
  type: "document",
  icon: CalendarClock,
  description: "An example day for one or more Programs, as a list of time slots.",
  fields: [
    titleField,
    programField,
    defineField({
      name: "programs",
      title: "Programs",
      type: "array",
      description:
        "The Programs whose day this is, from the side above. Choose at least one.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "programOffering" }],
          options: {
            filter: ({ document }) => ({
              filter: "program == $side",
              params: { side: sideOf(document) ?? "" },
            }),
          },
        }),
      ],
      validation: (rule) => [
        rule.required().min(1).error("Choose at least one Program."),
        rule.unique(),
        rule.custom(async (value: Reference[] | undefined, context) => {
          const side = sideOf(context.document);
          const ids = (value ?? []).map((item) => item._ref).filter(Boolean);
          if (!side || !ids.length) return true;
          const sides = await context
            .getClient({ apiVersion: API_VERSION })
            .fetch<string[]>("array::unique(*[_id in $ids].program)", { ids });
          return sides.every((program) => program === side)
            ? true
            : "Choose Programs of the same side as the schedule.";
        }),
      ],
    }),
    defineField({
      name: "slots",
      title: "Time slots",
      type: "array",
      description: "The day in order. Drag a slot to move it.",
      of: [defineArrayMember({ type: "sampleScheduleSlot" })],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "program" },
  },
});
