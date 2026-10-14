// Issue #17: the old Webflow paths that the live site sends on with a 301
// become published Redirect records, so links and search results that still
// use them reach the same page after the switch. Each redirect points at its
// page by reference, so it follows the page if an editor changes its slug.
// A Redirect record that already exists stays as it is.

export const LEGACY_REDIRECTS = [
  {
    id: "redirect-indoor-outdoor-playground",
    source: "/school-year/programs/indoor-outdoor-playground",
    destinationSlug: "school-year/programs/indoor-outdoor-play-center",
  },
];

export default {
  description: "Issue #17: published 301 Redirect records for the old Webflow paths.",

  prepare(dataset) {
    for (const redirect of LEGACY_REDIRECTS) {
      const pages = dataset.documents.filter(
        (document) =>
          document._type === "page" &&
          !document._id.includes(".") &&
          document.slug?.current === redirect.destinationSlug,
      );
      if (pages.length !== 1) {
        throw new Error(`${pages.length} published pages have the slug ${redirect.destinationSlug}, not 1`);
      }
      const taken = dataset.documents.find(
        (document) => document._type === "redirect" && document.source?.current === redirect.source,
      );
      if (taken) {
        dataset.note(`${redirect.source} has a Redirect record already (${taken._id}) and stays as it is.`);
        continue;
      }
      if (dataset.get(redirect.id)) continue;
      dataset.note(`${redirect.source} → /${redirect.destinationSlug} (301, active)`);
      dataset.create({
        _id: redirect.id,
        _type: "redirect",
        status: "active",
        source: { _type: "slug", current: redirect.source },
        destinationReference: { _type: "reference", _ref: pages[0]._id },
        permanent: "true",
      });
    }
    return (document) => document;
  },
};
