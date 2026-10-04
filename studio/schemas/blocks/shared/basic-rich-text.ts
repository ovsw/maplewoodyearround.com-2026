import { defineArrayMember, defineType } from "sanity";

/**
 * Basic rich text: paragraphs and bulleted lists with bold, italic and inline
 * links. No headings, images, tables or other blocks, so editors cannot break
 * a section's layout. Use it for short copy inside cards, tables and forms.
 */
export default defineType({
  name: "basicRichText",
  title: "Basic Rich Text",
  type: "array",
  of: [
    defineArrayMember({
      name: "block",
      type: "block",
      styles: [{ title: "Normal", value: "normal" }],
      lists: [{ title: "Bullet", value: "bullet" }],
      marks: {
        annotations: [defineArrayMember({ type: "customLink" })],
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
        ],
      },
    }),
  ],
});
