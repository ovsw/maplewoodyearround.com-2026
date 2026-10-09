import assert from "node:assert/strict";
import test from "node:test";
import { planMigration } from "../lib/migration.mjs";
import { pictureStem } from "../lib/pictures.mjs";
import migration from "./issue-61-merge-duplicate-pictures.mjs";

const WEBFLOW_ID = "67a9b41444a6fef9a6314194";
const OTHER_ID = "6778e005981c4d87aff0bfec";

const picture = (hash, originalFilename, width, height, _createdAt = "2026-10-04T03:00:00Z") => {
  const extension = originalFilename.split(".").at(-1).replace("jpeg", "jpg");
  return {
    _id: `image-${hash}-${width}x${height}-${extension}`,
    _type: "sanity.imageAsset",
    _createdAt,
    originalFilename,
    extension,
    metadata: { dimensions: { width, height } },
  };
};
const image = (asset) => ({ _type: "image", asset: { _type: "reference", _ref: asset._id } });

// Today's records: a jpeg and its avif copy, a name in two sizes, and a
// poster frame, with references from published, draft and release versions.
const BOB_JPEG = picture("a1", `${WEBFLOW_ID}_bob.jpeg`, 815, 815);
const BOB_AVIF = picture("a2", `${OTHER_ID}_${WEBFLOW_ID}_Bob (1).avif`, 815, 815, "2026-10-04T02:00:00Z");
const LAKE_WIDE = picture("b1", `${WEBFLOW_ID}_lake.jpeg`, 1600, 900);
const LAKE_SMALL = picture("b2", `${OTHER_ID}_lake.avif`, 800, 450);
const POSTER = picture("c1", "673ebf0eedfc15a41bedc0c3/673f_Hero-poster-00001.jpg", 1920, 1080);
const POSTER_COPY = picture("c2", "673ebf0eedfc15a41bedc0c3/673f_Hero-poster-00001.avif", 1920, 1080);

function fixtures() {
  return [
    BOB_JPEG,
    BOB_AVIF,
    LAKE_WIDE,
    LAKE_SMALL,
    POSTER,
    POSTER_COPY,
    { _id: "file-video-mp4", _type: "sanity.fileAsset", originalFilename: "hero.mp4" },
    { _id: "director", _type: "staffMember", photo: image(BOB_AVIF) },
    { _id: "drafts.director", _type: "staffMember", photo: image(BOB_AVIF) },
    { _id: "versions.spring.director", _type: "staffMember", photo: image(BOB_AVIF) },
    { _id: "home", _type: "page", sections: [{ _key: "s1", gallery: [image(BOB_AVIF), image(LAKE_SMALL)] }] },
    { _id: "drafts.about", _type: "page", hero: image(BOB_JPEG) },
  ];
}

const changed = (plan, id) => plan.changed.find(({ before }) => before._id === id)?.after;
const applied = (documents, plan) => {
  const after = new Map(documents.map((document) => [document._id, document]));
  for (const { after: document } of plan.changed) after.set(document._id, document);
  for (const document of plan.deleted) after.delete(document._id);
  return [...after.values()];
};

test("the jpeg wins over its avif copy of the same size, even with fewer references", () => {
  const plan = planMigration(migration, fixtures());
  assert.deepEqual(
    plan.deleted.map((document) => document._id),
    [BOB_AVIF._id],
  );
  assert.equal(changed(plan, "home").sections[0].gallery[0].asset._ref, BOB_JPEG._id);
  assert.match(plan.notes.join("\n"), new RegExp(`Keep ${BOB_JPEG.originalFilename}.*\\n  delete ${BOB_AVIF.originalFilename.replace(/[()]/g, "\\$&")}`));
});

test("references move in published, draft and release versions", () => {
  const plan = planMigration(migration, fixtures());
  for (const id of ["director", "drafts.director", "versions.spring.director"])
    assert.equal(changed(plan, id).photo.asset._ref, BOB_JPEG._id);
  assert.equal(changed(plan, "drafts.about"), undefined);
  assert.deepEqual(plan.referenceChecks, [
    {
      id: BOB_AVIF._id,
      before: ["director (staffMember)", "drafts.director (staffMember)", "versions.spring.director (staffMember)", "home (page)"],
      after: [],
    },
  ]);
});

test("the same name in different sizes is listed and left alone", () => {
  const plan = planMigration(migration, fixtures());
  assert.equal(changed(plan, "home").sections[0].gallery[1].asset._ref, LAKE_SMALL._id);
  assert.ok(!plan.deleted.some((document) => [LAKE_WIDE._id, LAKE_SMALL._id].includes(document._id)));
  assert.ok(plan.notes.includes(`Not merged, "lake" in different sizes: 1600x900 ${LAKE_WIDE.originalFilename}; 800x450 ${LAKE_SMALL.originalFilename}`));
  assert.match(plan.notes.at(-1), /^4 pictures: 1 groups merged, 1 copies deleted, 1 names in different sizes left alone, 3 pictures kept\.$/);
});

test("among copies in the same format, the most referenced wins, then the oldest", () => {
  const older = picture("d1", `${WEBFLOW_ID}_swim.avif`, 730, 730, "2026-10-01T00:00:00Z");
  const used = picture("d2", `${OTHER_ID}_swim.webp`, 730, 730, "2026-10-02T00:00:00Z");
  const newer = picture("d3", `${OTHER_ID}_swim-1.avif`, 730, 730, "2026-10-03T00:00:00Z");
  const plan = planMigration(migration, [older, used, newer, { _id: "pool", _type: "facility", image: image(used) }]);
  assert.deepEqual(plan.deleted.map((document) => document._id).sort(), [newer._id, older._id].sort());

  const unused = planMigration(migration, [newer, older]);
  assert.deepEqual(unused.deleted.map((document) => document._id), [newer._id]);
});

test("a second run plans nothing", () => {
  const plan = planMigration(migration, fixtures());
  const second = planMigration(migration, applied(fixtures(), plan));
  assert.deepEqual([second.created, second.changed, second.deleted], [[], [], []]);
});

test("the run fails when a deleted copy is still referenced", () => {
  // A change that skips one record leaves its reference to the deleted copy.
  const skipsDraft = {
    ...migration,
    prepare(dataset) {
      const change = migration.prepare(dataset);
      return (document) => (document._id === "drafts.director" ? document : change(document));
    },
  };
  assert.throws(
    () => planMigration(skipsDraft, fixtures()),
    new RegExp(`Cannot delete ${BOB_AVIF._id}; still referenced by drafts\\.director`),
  );
});

test("video posters and other files are left alone", () => {
  const plan = planMigration(migration, fixtures());
  for (const id of [POSTER._id, POSTER_COPY._id, "file-video-mp4"])
    assert.ok(!plan.deleted.some((document) => document._id === id));
});

test("the name stem drops Webflow ID prefixes, the extension and a copy counter", () => {
  for (const [filename, stem] of [
    [`${WEBFLOW_ID}_bob.jpeg`, "bob"],
    [`${OTHER_ID}_${WEBFLOW_ID}_bob.avif`, "bob"],
    [`${WEBFLOW_ID}_bob-(1).png`, "bob"],
    [`${WEBFLOW_ID}_bob-(1)-(1).jpeg`, "bob"],
    [`${WEBFLOW_ID}_bob (2).avif`, "bob"],
    [`${WEBFLOW_ID}_bob-1.webp`, "bob"],
    [`${WEBFLOW_ID}_Bob.JPEG`, "bob"],
    [`${WEBFLOW_ID}_Swan Boat  Smiles.avif`, "swan-boat-smiles"],
    [`${WEBFLOW_ID}_swan-boat-smiles.jpeg`, "swan-boat-smiles"],
    [`${WEBFLOW_ID}_party-room-3.jpeg`, "party-room-3"],
    [`${WEBFLOW_ID}_maplewoodgym-1013.webp`, "maplewoodgym-1013"],
    ["1554206041-img7772.avif", "1554206041-img7772"],
  ])
    assert.equal(pictureStem(filename), stem, filename);
});
