import { defineArrayMember, defineType } from "sanity";

/**
 * Deliberately minimal rich text: paragraphs with bold, italic, and inline
 * links, nothing else. Use it where copy needs multiple paragraphs but must
 * not introduce headings, lists, or embedded media that would break the
 * section's design.
 */
export default defineType({
  name: "simpleRichText",
  title: "Simple Rich Text",
  type: "array",
  of: [
    defineArrayMember({
      name: "block",
      type: "block",
      styles: [{ title: "Normal", value: "normal" }],
      lists: [],
      marks: {
        annotations: [
          defineArrayMember({
            type: "customLink",
          }),
        ],
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
        ],
      },
    }),
  ],
});
