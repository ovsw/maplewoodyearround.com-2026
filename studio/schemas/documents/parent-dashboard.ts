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
