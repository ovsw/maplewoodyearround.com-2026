// Issue #86: the bus map section draws a native Google map from the Bus
// stops, so its pasted Snazzy map URL goes. The run removes `embedUrl` from
// every bus map section (Home and Contact & Enrollment today). Every stored
// version changes on its own, so a draft stays a draft and a published page
// stays published. Embed sections keep their URLs: the Bus page's "Map" embed
// is converted in #88.

const hasMapUrl = (block) => block?._type === "busMap" && block.embedUrl !== undefined;

/** The page without a map URL on any of its bus map sections. */
export function withoutBusMapUrls(document) {
  if (!Array.isArray(document.blocks) || !document.blocks.some(hasMapUrl)) return document;
  return {
    ...document,
    blocks: document.blocks.map((block) => {
      if (!hasMapUrl(block)) return block;
      const { embedUrl: _removed, ...rest } = block;
      return rest;
    }),
  };
}

export default {
  description: "Issue #86: remove the Snazzy map URL from the bus map sections.",

  prepare(dataset) {
    const pages = dataset.documents.filter((document) => document.blocks?.some?.(hasMapUrl));
    for (const page of pages) {
      const urls = page.blocks.filter(hasMapUrl).map((block) => block.embedUrl);
      dataset.note(`${page._id}: remove ${urls.map((url) => JSON.stringify(url)).join(", ")}`);
    }
    if (!pages.length) dataset.note("No bus map section has a map URL.");
    return withoutBusMapUrls;
  },
};
