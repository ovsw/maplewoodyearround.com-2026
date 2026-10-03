// Turn a page's sections into plain text so copy can be read as a reader
// would, without Studio. Used by print-page-text.mjs.

const TEXT_FIELDS = new Set([
  "title",
  "heading",
  "subheading",
  "eyebrow",
  "intro",
  "description",
  "body",
  "text",
  "label",
  "meta",
  "time",
  "value",
  "question",
  "answer",
  "quote",
  "author",
  "buttonText",
  "name",
  "alt",
  "caption",
  "note",
]);

function portableText(blocks) {
  return blocks
    .filter((block) => block && block._type === "block")
    .map((block) => {
      const text = (block.children ?? [])
        .map((child) =>
          child.marks?.includes("em") ? `*${child.text ?? ""}*` : (child.text ?? ""),
        )
        .join("");
      if (block.listItem) return `- ${text}`;
      if (block.style === "blockquote") return `> ${text}`;
      if (/^h\d$/.test(block.style ?? "")) return `\n**${text}**`;
      return text;
    })
    .join("\n");
}

function walk(value, out) {
  if (Array.isArray(value)) {
    const blocks = value.filter((item) => item?._type === "block");
    if (blocks.length) out.push(portableText(blocks));
    value.filter((item) => item?._type !== "block").forEach((item) => walk(item, out));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (key.startsWith("_")) continue;
    if (typeof item === "string" && TEXT_FIELDS.has(key)) out.push(`${key}: ${item}`);
    else walk(item, out);
  }
}

/** Plain-text rendering of one section, one line per text field. */
export function sectionText(section) {
  const lines = [];
  walk(section, lines);
  return lines.join("\n");
}

export function normalizeSlug(input) {
  return `${input ?? ""}`.trim().replace(/^https?:\/\/[^/]+/, "").replace(/^\/+|\/+$/g, "");
}

/** GROQ filter matching a page by slug with or without leading or trailing slashes. */
export const SLUG_FILTER =
  'slug.current in [$slug, "/" + $slug, $slug + "/", "/" + $slug + "/"]';
