import { defineArrayMember, defineField } from "sanity";

export const programOptions = [
  { title: "Summer Camp", value: "summerCamp" },
  { title: "School Year", value: "schoolYear" },
];

export const programField = defineField({
  name: "program", title: "Program", type: "string",
  description: "Choose the part of Maplewood that uses this content.",
  options: { list: programOptions, layout: "radio" },
  validation: (rule) => rule.required(),
});

export const visibleField = defineField({
  name: "visible", title: "Show on the website", type: "boolean", initialValue: true,
  description: "Turn off to hide this item from lists without deleting it.",
});

export const orderField = defineField({
  name: "order", title: "List order", type: "number",
  description: "Lower numbers appear first. Leave empty to sort after numbered items.",
  validation: (rule) => rule.integer().min(0),
});

export const titleField = defineField({
  name: "title", title: "Title", type: "string",
  description: "The name visitors see for this item.",
  validation: (rule) => rule.required(),
});

export const slugField = defineField({
  name: "slug", title: "URL name", type: "slug",
  description: "The short name retained from the old site. Changing this does not create a page.",
  options: { source: "title" },
});

export function imageField(name = "image", title = "Image") {
  return defineField({
    name, title, type: "image", options: { hotspot: true },
    description: "Upload or choose an image. Set its crop and point of interest.",
    fields: [defineField({
      name: "alt", title: "Image description", type: "string",
      description: "Describe the image for visitors who cannot see it. Leave empty for decoration.",
    })],
  });
}

export function referenceField(name: string, title: string, type: string, description: string) {
  return defineField({ name, title, type: "reference", to: [{ type }], description });
}

export function referencesField(name: string, title: string, type: string, description: string) {
  return defineField({
    name, title, type: "array", description,
    of: [defineArrayMember({ type: "reference", to: [{ type }] })],
    validation: (rule) => rule.unique(),
  });
}

export function textField(name: string, title: string, description: string) {
  return defineField({ name, title, description, type: "string" });
}

export function descriptionField(name = "description", title = "Description") {
  return defineField({ name, title, type: "text", rows: 3, description: "The explanation shown with this item." });
}

export function switchField(name: string, title: string, description: string) {
  return defineField({ name, title, description, type: "boolean", initialValue: false });
}

export const contentPreview = { select: { title: "title", subtitle: "program", media: "image" } };
