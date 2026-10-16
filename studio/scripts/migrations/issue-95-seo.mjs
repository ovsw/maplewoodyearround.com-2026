// Issue #95: the SEO titles and descriptions came over from Webflow, and many
// are too long, too short, miss the place or repeat another page. The run
// proposes new values in each page's draft for Ovi's review. The published
// versions do not change. A draft that already exists is changed only while
// its SEO values and the published ones are still the values recorded here.

import { readFileSync } from "node:fs";

/** The pages to change, by record id, with the values today and the proposal. */
export const SEO_CHANGES = Object.fromEntries(
  JSON.parse(readFileSync(new URL("./data/issue-95-seo.json", import.meta.url), "utf8")).map((change) => [
    change.id,
    change,
  ]),
);

const SYSTEM = ["_rev", "_createdAt", "_updatedAt"];
const sameSeo = (meta, values) =>
  (meta?.title ?? null) === values.title && (meta?.description ?? null) === values.description;
const withSeo = (document, values) => ({ ...document, meta: { ...document.meta, ...values } });

export default {
  description: "Issue #95: propose new SEO titles and descriptions in the drafts of every indexed page and News post.",

  prepare(dataset) {
    const pending = new Set();
    for (const [id, change] of Object.entries(SEO_CHANGES)) {
      const published = dataset.get(id);
      if (!published || published.title !== change.title)
        throw new Error(`${id} is not the published page "${change.title}"`);
      const draft = dataset.get(`drafts.${id}`);
      if (sameSeo((draft ?? published).meta, change.to)) continue;
      if (!sameSeo(published.meta, change.from)) {
        dataset.note(`Left alone: "${change.path}" has published SEO values an editor changed.`);
        continue;
      }
      if (!draft) {
        const copy = Object.fromEntries(Object.entries(published).filter(([key]) => !SYSTEM.includes(key)));
        dataset.create(withSeo({ ...copy, _id: `drafts.${id}` }, change.to));
      } else if (sameSeo(draft.meta, change.from)) pending.add(draft._id);
      else dataset.note(`Left alone: the draft of "${change.path}" has SEO values an editor changed.`);
    }

    return (document) =>
      pending.has(document._id) ? withSeo(document, SEO_CHANGES[document._id.slice("drafts.".length)].to) : document;
  },
};
