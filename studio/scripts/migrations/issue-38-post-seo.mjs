// Issue #38: two Active News posts carry doubtful SEO values from Airtable
// ("Monthy" typo, a "⭐️ Sand Play…" fragment, the title "Play Center"). The
// run proposes better values in each post's draft for Ovi's review. The
// published versions do not change. A draft that already exists is changed
// only while its SEO values are still the Airtable ones.

const post = (suffix) => `wf-677d49d61db2a021fe854a5a-${suffix}`;

/** The posts to fix, by record id, with the values today and the proposal. */
export const SEO_FIXES = {
  [post("677d4bbcc765246d913bf053")]: {
    title: "Monthly Memberships",
    from: {
      title: "Monthy Membership to Our Indoor Playground",
      description: "⭐️ Sand Play, Playsets & Sports",
    },
    to: {
      title: "Monthly Membership to Our Indoor Playground",
      description:
        "Monthly memberships to our Indoor Playground: $110 for 1 child, $190 for 2 children and $250 for 3 children. 3-month minimum. Join today!",
    },
  },
  [post("6abe749027d0bc0cf245f0e6")]: {
    title: "Costumes, Treats & Play: Halloween Week at Maplewood",
    from: { title: "Play Center", description: "Halloween at Play Center" },
    to: {
      title: "Trick-or-Treat Halloween Week, October 26–31",
      description:
        "Halloween Week at Maplewood, October 26–31: character visits, pony rides, face painting and a costume parade at our Halloween Party on October 31.",
    },
  },
};

const SYSTEM = ["_rev", "_createdAt", "_updatedAt"];
const sameSeo = (meta, values) => meta?.title === values.title && meta?.description === values.description;
const withSeo = (document, values) => ({ ...document, meta: { ...document.meta, ...values } });

export default {
  description: "Issue #38: propose fixed SEO titles and descriptions in the drafts of two News posts.",

  prepare(dataset) {
    const pending = new Set();
    for (const [id, fix] of Object.entries(SEO_FIXES)) {
      const published = dataset.get(id);
      if (published?._type !== "post" || published.title !== fix.title)
        throw new Error(`${id} is not the published post "${fix.title}"`);
      const draft = dataset.get(`drafts.${id}`);
      if (!draft) {
        const copy = Object.fromEntries(Object.entries(published).filter(([key]) => !SYSTEM.includes(key)));
        dataset.create(withSeo({ ...copy, _id: `drafts.${id}` }, fix.to));
      } else if (sameSeo(draft.meta, fix.from)) pending.add(draft._id);
      else if (!sameSeo(draft.meta, fix.to))
        dataset.note(`Left alone: the draft of "${fix.title}" has SEO values an editor changed.`);
    }

    return (document) =>
      pending.has(document._id) ? withSeo(document, SEO_FIXES[document._id.slice("drafts.".length)].to) : document;
  },
};
