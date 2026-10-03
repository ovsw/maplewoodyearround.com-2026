/**
 * Fail-closed allowlist check for the icon SVG markup stored in Sanity.
 *
 * The markup is produced by the Studio picker, either from Lucide components
 * or from the two-tone camp icon catalog, so real values fit a very narrow
 * grammar: nested drawing elements whose attributes are always double-quoted. Anything outside that grammar — unknown elements,
 * unknown or unquoted attributes, event handlers, stray angle brackets — is
 * rejected rather than stripped, so a write made around the Studio cannot
 * reach dangerouslySetInnerHTML.
 */

const ALLOWED_TAGS = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "ellipse",
]);

const ALLOWED_ATTRIBUTES = new Set([
  "xmlns",
  "width",
  "height",
  "viewbox",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "class",
  "aria-hidden",
  // Two-tone camp icons draw their secondary shape at reduced opacity.
  "opacity",
  "d",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "points",
  "transform",
]);

// A whole tag: name, then only whitespace-separated double-quoted attributes.
// Tags with unquoted or malformed attributes never match, survive the replace
// below, and fail the final angle-bracket check.
const TAG_PATTERN =
  /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[a-zA-Z][a-zA-Z0-9:-]*="[^"<>]*")*)\s*\/?>/g;
const ATTRIBUTE_PATTERN = /([a-zA-Z][a-zA-Z0-9:-]*)="[^"<>]*"/g;

export function isSafeIconSvg(svg: string): boolean {
  if (!svg.startsWith("<svg") || !svg.endsWith("</svg>")) return false;

  const remainder = svg.replace(TAG_PATTERN, (tag, name: string, attributes: string) => {
    if (!ALLOWED_TAGS.has(name.toLowerCase())) return "<";
    for (const match of attributes.matchAll(ATTRIBUTE_PATTERN)) {
      if (!ALLOWED_ATTRIBUTES.has(match[1].toLowerCase())) return "<";
    }
    return "";
  });

  // Only inter-tag text may remain, and none of it may open another tag.
  return !/[<>]/.test(remainder);
}
