import { defineField, defineType } from "sanity";
import { imageField, orderField, programField, slugField, switchField, textField, visibleField } from "./maplewood-fields";

export default defineType({
  name: "staffMember", title: "Staff member", type: "document",
  description: "One staff profile for Summer Camp or School Year.",
  fields: [
    defineField({ ...textField("name", "Name", "The staff member's public name."), validation: (rule) => rule.required() }),
    { ...slugField, options: { source: "name" } },
    programField,
    defineField({ name: "profileGroup", title: "Profile group", type: "string", description: "Use Leadership for the authored leadership profiles, or Roster for staff lists.", initialValue: "roster", options: { list: ["roster", "leadership"] } }),
    imageField(),
    textField("role", "Role", "Their job title shown below their name."),
    textField("training", "Degrees and training", "Public qualifications shown on the School Year roster."),
    defineField({ name: "yearsAtMaplewood", title: "Years at Maplewood", type: "number", description: "The number of years shown on the staff card.", validation: (rule) => rule.integer().min(0) }),
    switchField("yearRound", "Year-round staff member", "Show the year-round staff badge."),
    switchField("formerCamper", "Former camper", "Show that this staff member attended Maplewood."),
    switchField("givesTours", "Gives School Year tours", "Include this person in School Year tour information."),
    switchField("preschoolTeacher", "Preschool teacher", "Include this person in the preschool staff list."),
    defineField({ name: "bio", title: "Biography", type: "richTextContent", description: "Public background and experience for a detailed profile." }),
    textField("email", "Public email", "Only an email already approved for the public website."),
    textField("phone", "Public phone", "Only a phone number already approved for the public website."),
    orderField, visibleField,
  ],
  preview: { select: { title: "name", subtitle: "role", media: "image" } },
});
