import {
  defineBlueprint,
  defineDocumentFunction,
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
  ],
});
