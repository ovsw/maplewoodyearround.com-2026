import {
  defineBlueprint,
  defineDocumentFunction,
  defineSyncTagInvalidateFunction,
} from "@sanity/blueprints";

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: "auto-redirect",
      src: "./functions/auto-redirect",
      memory: 2,
      timeout: 30,
      event: {
        on: ["publish"],
        filter:
          '_type in ["page", "post", "category"] && delta::changedAny(slug.current)',
        projection: `{
          "documentId": after()._id,
          "documentType": after()._type,
          "beforeSlug": before().slug.current,
          "slug": after().slug.current
        }`,
      },
    }),

    // On every publish, tells the Website which cached content changed. See
    // "Content goes live on publish" in docs/deployment.md.
    defineSyncTagInvalidateFunction({
      name: "invalidate-tags",
      src: "./functions/invalidate-tags",
      timeout: 20,
      event: {
        resource: { type: "dataset", id: "193h5qm1.production" },
      },
    }),
  ],
});
