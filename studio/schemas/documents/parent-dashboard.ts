import { defineArrayMember, defineField, defineType } from "sanity";
import { descriptionField, imageField, orderField, referencesField, slugField, switchField, textField, titleField, visibleField } from "./maplewood-fields";

export const dashboardCard = defineType({
  name: "dashboardCard", title: "Parent dashboard card", type: "document",
  description: "A link or download shown in one or both Parent dashboard tabs.",
  fields: [
    titleField, slugField,
    descriptionField("text", "Card text"),
    textField("colorTheme", "Color theme", "The source card color name used by the Parent dashboard."),
    imageField(),
    switchField("showImage", "Show image", "Show the card image when one is set."),
    switchField("showIcon", "Show icon", "Show the selected card icon."),
    textField("iconName", "Icon name", "The icon name for the card. Imported icon markup is converted to a supported icon."),
    defineField({ name: "iconCode", title: "Imported icon code", type: "string", description: "Original source icon text, retained for the importer. Never rendered as HTML.", readOnly: true, hidden: true }),
    textField("linkText", "Link text", "The text visitors click to open this card."),
    defineField({ name: "destination", title: "Link or file", type: "contentDestination", description: "Choose a page, external URL or uploaded file. Cards without a destination are hidden." }),
    referencesField("seasons", "Seasons", "season", "Choose the seasons whose Parent dashboard tabs show this card."),
    orderField, visibleField,
  ],
  preview: { select: { title: "title", subtitle: "linkText", media: "image" } },
});

export default defineType({
  name: "parentDashboard", title: "Parent dashboard", type: "document",
  description: "The dashboard heading and tab labels. Cards are managed in Parent dashboard cards.",
  fields: [
    titleField,
    descriptionField("intro", "Introduction"),
    textField("schoolYearLabel", "School Year tab label", "The label of the School Year tab."),
    textField("summerCampLabel", "Summer Camp tab label", "The label of the Summer Camp tab."),
  ],
  initialValue: { title: "Parent Dashboard", schoolYearLabel: "School Year", summerCampLabel: "Summer Camp" },
  preview: { select: { title: "title" } },
});

export const summerDocuments = defineType({
  name: "summerDocuments", title: "Summer documents", type: "document",
  description: "The group schedules and welcome letters for one summer, grouped by grade.",
  fields: [
    defineField({ name: "seasonLabel", title: "Summer", type: "string", description: "The summer covered by these documents, for example Summer 2027.", validation: (rule) => rule.required() }),
    defineField({
      name: "gradeGroups", title: "Documents by grade", type: "array",
      description: "Add each grade once, then put its schedules and welcome letters in order.",
      of: [defineArrayMember({
        name: "gradeDocuments", title: "Grade documents", type: "object",
        fields: [
          defineField({ name: "grade", title: "Grade", type: "reference", to: [{ type: "grade" }], description: "The entering grade for this group of documents.", validation: (rule) => rule.required() }),
          defineField({
            name: "entries", title: "Documents", type: "array",
            description: "Replace the PDF here each summer. Both document pages read this list.",
            of: [defineArrayMember({
              name: "summerDocumentEntry", title: "Summer document", type: "object",
              fields: [
                titleField,
                defineField({ name: "kind", title: "Document kind", type: "string", description: "Choose which page shows this PDF.", options: { list: [{ title: "Group schedule", value: "schedule" }, { title: "Welcome letter", value: "welcomeLetter" }] }, validation: (rule) => rule.required() }),
                defineField({ name: "group", title: "Camp group", type: "reference", to: [{ type: "campGroup" }], description: "The camp group this document applies to." }),
                defineField({ name: "file", title: "PDF", type: "file", description: "Upload the current PDF. Files stay in Sanity so they can be replaced here.", options: { accept: "application/pdf" }, validation: (rule) => rule.required() }),
              ],
              preview: { select: { title: "title", subtitle: "kind" } },
            })],
          }),
        ],
        preview: { select: { title: "grade.title" } },
      })],
    }),
  ],
  preview: { select: { title: "seasonLabel" } },
});
