import { defineField, defineType } from "sanity";

export const SECTION_BACKGROUNDS = [
  { title: "Default", value: "white" },
  { title: "Muted", value: "cream" },
  { title: "Dark", value: "green" },
] as const;

type SectionBackground = (typeof SECTION_BACKGROUNDS)[number]["value"];

export const sectionBackgroundField = defineField({
  name: "background",
  title: "Background",
  type: "sectionBackground",
  description: "Choose the background behind this section.",
  initialValue: "white",
});

export const sectionBackground = defineType({
  name: "sectionBackground",
  title: "Section Background",
  type: "string",
  options: { list: [...SECTION_BACKGROUNDS] },
  initialValue: "white" satisfies SectionBackground,
});
