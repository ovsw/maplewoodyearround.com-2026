import { defineArrayMember, defineField, defineType } from "sanity";
import meta from "../blocks/shared/meta";
import {
  accentField,
  iconField,
  taglineField,
} from "../blocks/shared/maplewood-fields";
import { descriptionField, imageField, textField, titleField } from "./maplewood-fields";

const dashboardCard = defineArrayMember({
  name: "dashboardCard",
  title: "Card",
  type: "object",
  fields: [
    titleField,
    descriptionField("text", "Text"),
    accentField,
    {
      ...iconField,
      description: "Optional. Shown above the heading when the card has no image.",
    },
    {
      ...imageField(),
      description: "Optional. Shown across the top of the card instead of the icon.",
    },
    defineField({
      name: "link",
      title: "Link",
      type: "contentAction",
      description:
        "Choose a page, another website or an uploaded file. A card without a destination is hidden.",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "link.label", media: "image" },
  },
});

const cardsField = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "array",
    group: "content",
    description: "Cards in display order. Drag to reorder.",
    of: [dashboardCard],
  });

export default defineType({
  name: "parentDashboard",
  title: "Parent dashboard",
  type: "document",
  description: "The Parent dashboard page, with one list of cards for each tab.",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    { ...taglineField, group: "content" },
    { ...titleField, title: "Heading", group: "content" },
    { ...descriptionField("intro", "Introduction"), group: "content" },
    defineField({
      name: "tabsPrompt",
      title: "Text above the tabs",
      type: "simpleRichText",
      group: "content",
      description: 'For example "Select Season:".',
    }),
    {
      ...textField("schoolYearLabel", "School Year tab label", "The label of the School Year tab."),
      group: "content",
    },
    cardsField("schoolYearCards", "School Year cards"),
    {
      ...textField("summerCampLabel", "Summer Camp tab label", "The label of the Summer Camp tab. This tab opens first."),
      group: "content",
    },
    cardsField("summerCampCards", "Summer Camp cards"),
    meta,
  ],
  initialValue: {
    title: "Parent Dashboard",
    schoolYearLabel: "School Year",
    summerCampLabel: "Summer Camp",
  },
  preview: { select: { title: "title" } },
});

export const summerDocuments = defineType({
  name: "summerDocuments",
  title: "Summer documents",
  type: "document",
  description:
    "The group schedules and welcome letters for one summer, grouped by grade.",
  fields: [
    defineField({
      name: "seasonLabel",
      title: "Summer",
      type: "string",
      description:
        "The summer covered by these documents, for example Summer 2027.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "gradeGroups",
      title: "Documents by grade",
      type: "array",
      description:
        "Add each grade once, then put its schedules and welcome letters in order.",
      of: [
        defineArrayMember({
          name: "gradeDocuments",
          title: "Grade documents",
          type: "object",
          fields: [
            defineField({
              name: "grade",
              title: "Grade",
              type: "reference",
              to: [{ type: "grade" }],
              description: "The entering grade for this group of documents.",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "heading",
              title: "Heading",
              type: "string",
              description:
                "Optional. Replaces the grade name above this list, for example 8th & 9th Grades.",
            }),
            defineField({
              name: "entries",
              title: "Documents",
              type: "array",
              description:
                "Replace the PDF here each summer. Both document pages read this list.",
              of: [
                defineArrayMember({
                  name: "summerDocumentEntry",
                  title: "Summer document",
                  type: "object",
                  fields: [
                    titleField,
                    defineField({
                      name: "kind",
                      title: "Document kind",
                      type: "string",
                      description: "Choose which page shows this PDF.",
                      options: {
                        list: [
                          { title: "Group schedule", value: "schedule" },
                          { title: "Welcome letter", value: "welcomeLetter" },
                        ],
                      },
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "group",
                      title: "Camp group",
                      type: "reference",
                      to: [{ type: "campGroup" }],
                      description: "The camp group this document applies to.",
                    }),
                    defineField({
                      name: "file",
                      title: "PDF",
                      type: "file",
                      description:
                        "Upload the current PDF. Files stay in Sanity so they can be replaced here.",
                      options: { accept: "application/pdf" },
                      validation: (rule) => rule.required(),
                    }),
                  ],
                  preview: { select: { title: "title", subtitle: "kind" } },
                }),
              ],
            }),
          ],
          preview: {
            select: { heading: "heading", grade: "grade.title" },
            prepare: ({ heading, grade }) => ({ title: heading || grade }),
          },
        }),
      ],
    }),
  ],
  preview: { select: { title: "seasonLabel" } },
});
