import { defineArrayMember, defineType } from "sanity";

/**
 * The most minimal rich text: paragraphs with bold and italic only.
 * No links, no lists, no headings, no media. Use it where copy needs
 * inline emphasis (e.g. an accent word in a heading) but must not
 * introduce any structural or navigational elements.
 */
export default defineType({
  name: "minimalRichText",
  title: "Minimal Rich Text",
  type: "array",
  of: [
    defineArrayMember({
      name: "block",
      type: "block",
      styles: [{ title: "Normal", value: "normal" }],
      lists: [],
      marks: {
        annotations: [],
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
        ],
      },
    }),
  ],
});
