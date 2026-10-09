// Give the remaining "Arts Class" FAQ category the URL name "arts-class".
// The Webflow import named it "arts-class-16799" because of the empty
// duplicate that issue #47 deleted.

import { recordId } from "../lib/migration.mjs";

export const ARTS_CLASS = "wf-6797b73cfd315e900db665c5-6797b88c805f80670b7e9f2c";
export const SLUG = "arts-class";

export default {
  description: 'The remaining "Arts Class" FAQ category gets the URL name "arts-class".',

  prepare(dataset) {
    if (dataset.get(ARTS_CLASS)?.title !== "Arts Class")
      throw new Error(`The Arts Class FAQ category ${ARTS_CLASS} is missing or renamed`);
    const taken = dataset.documents.filter(
      (document) =>
        document._type === "faqCategory" && document.slug?.current === SLUG && recordId(document._id) !== ARTS_CLASS,
    );
    if (taken.length) throw new Error(`The URL name "${SLUG}" is taken by ${taken.map((document) => document._id).join(", ")}`);

    return (document) =>
      recordId(document._id) === ARTS_CLASS ? { ...document, slug: { _type: "slug", current: SLUG } } : document;
  },
};
