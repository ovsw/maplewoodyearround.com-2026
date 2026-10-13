// Issue #88: the Free Bus Transportation page shows the native bus map with
// its stop list. The run turns every embed section whose provider is "Map"
// (the Bus page's "Bus Stop Map" today) into a bus map section with
// "Show the stop list" on. The section keeps its key, background, link
// anchor (#bus-map), title, towns-served description and buttons. The
// Snazzy URL, the embed description and the provider go: the bus map draws
// the Bus stops itself. Every stored version changes on its own, so a draft
// stays a draft and a published page stays published.

/** Fields the bus map section keeps from the embed section. */
const KEPT = ["_key", "background", "anchorId", "title", "description", "actions"];
/** Fields that belong only to the Snazzy embed; the bus map does not need them. */
const DROPPED = ["_type", "embedUrl", "frameTitle", "provider"];

const isMapEmbed = (block) => block?._type === "embedSection" && block.provider === "Map";

const hasValue = (value) =>
  value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && !value.length);

/** Content on a Map embed that the bus map section has no place for. */
export function contentLost(block) {
  return Object.keys(block).filter(
    (key) => !KEPT.includes(key) && !DROPPED.includes(key) && hasValue(block[key]),
  );
}

/** The bus map section that replaces a Map embed section. */
export function busMapFromEmbed(block) {
  const section = { _key: block._key, _type: "busMap" };
  for (const key of KEPT.slice(1)) if (hasValue(block[key])) section[key] = block[key];
  section.showStopList = true;
  return section;
}

/** The page with each Map embed section turned into a bus map section. */
export function withBusMapSections(document) {
  if (!Array.isArray(document.blocks) || !document.blocks.some(isMapEmbed)) return document;
  return {
    ...document,
    blocks: document.blocks.map((block) => (isMapEmbed(block) ? busMapFromEmbed(block) : block)),
  };
}

export default {
  description: 'Issue #88: turn the "Map" embed sections into bus map sections with the stop list.',

  prepare(dataset) {
    const pages = dataset.documents.filter((document) => document.blocks?.some?.(isMapEmbed));
    for (const page of pages)
      for (const block of page.blocks.filter(isMapEmbed)) {
        const lost = contentLost(block);
        if (lost.length)
          throw new Error(
            `${page._id}: the Map embed section ${block._key} has ${lost.join(", ")}, which a bus map section cannot keep`,
          );
        dataset.note(`${page._id}: section ${block._key} "${block.title ?? ""}" becomes a bus map with the stop list`);
      }
    if (!pages.length) dataset.note('No embed section uses the "Map" provider.');
    return withBusMapSections;
  },
};
