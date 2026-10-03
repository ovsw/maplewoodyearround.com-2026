// Builders for the Sanity shapes a page seed needs. Import from a seed module:
//   import { p, heading, image, internal, external, button, icon } from "../lib/portable-text.mjs";
// Every builder takes an explicit key so a rerun of the seed writes the same
// keys and Studio keeps its click-to-edit paths stable.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { dynamicIconImports } from "lucide-react/dynamic.mjs";

export const span = (key, text, marks = []) => ({ _key: key, _type: "span", marks, text });

export const block = (key, children, style = "normal", extra = {}) => ({
  _key: key,
  _type: "block",
  children,
  markDefs: [],
  style,
  ...extra,
});

/** One paragraph. */
export const p = (key, text) => block(key, [span(`${key}-s`, text)]);

/** One blockquote paragraph. */
export const quote = (key, text) => block(key, [span(`${key}-s`, text)], "blockquote");

/** One bullet list item (pass several in a row for a list). */
export const bullet = (key, text) =>
  block(key, [span(`${key}-s`, text)], "normal", { listItem: "bullet", level: 1 });

/**
 * A section heading as minimalRichText: the plain part, then the accent phrase
 * that renders in the handwritten Campfire Amber script (an `em` mark).
 * Pass an empty accent to skip the script.
 */
export const heading = (key, plain, accent = "") => [
  block(key, [
    span(`${key}-a`, plain),
    ...(accent ? [span(`${key}-b`, accent, ["em"])] : []),
  ]),
];

/** Plain rich text from an array of strings, one paragraph each. */
export const paragraphs = (key, texts) => texts.map((text, index) => p(`${key}-${index + 1}`, text));

export const image = (assetRef, alt, extra = {}) => ({
  _type: "image",
  alt,
  asset: { _ref: assetRef, _type: "reference" },
  ...extra,
});

/** customUrl pointing at a document (page, homePage, post, blogIndex). */
export const internal = (documentId) => ({
  _type: "customUrl",
  type: "internal",
  openInNewTab: false,
  internal: { _ref: documentId, _type: "reference" },
});

/** customUrl pointing at an absolute URL, a site path, or an anchor. */
export const external = (url, openInNewTab = false) => ({
  _type: "customUrl",
  type: "external",
  openInNewTab,
  external: url,
});

/** Button variants: default (amber), secondary, outline, ghost, link. */
export const button = (key, text, url, variant = "default") => ({
  _key: key,
  _type: "button",
  text,
  url,
  variant,
});

export const reference = (key, documentId) => ({
  _key: key,
  _type: "reference",
  _ref: documentId,
});

/**
 * A stored lucide icon `{ name, svg }`, the shape the icon picker writes.
 * Names come from studio/schemas/inputs/lucide-icon-names.ts.
 */
export async function icon(name) {
  const load = dynamicIconImports[name];
  if (!load) throw new Error(`Unknown lucide icon: ${name}`);
  const module = await load();
  return {
    name,
    svg: renderToStaticMarkup(createElement(module.default, { "aria-hidden": true })),
  };
}
