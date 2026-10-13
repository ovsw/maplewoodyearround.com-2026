import assert from "node:assert/strict";
import test from "node:test";
import { isEmpty, planMigration } from "../lib/migration.mjs";
import migration from "./issue-86-bus-map-url.mjs";

const SNAZZY = "https://snazzymaps.com/embed/661063";
const busMap = (key, extra = {}) => ({
  _key: key,
  _type: "busMap",
  title: "Free Bus Transportation",
  embedUrl: SNAZZY,
  cards: [{ _key: "c1", title: "Free" }],
  ...extra,
});
const mapEmbed = { _key: "embed", _type: "embedSection", provider: "Map", embedUrl: SNAZZY };

const documents = [
  { _id: "homePage", _type: "homePage", _rev: "r1", blocks: [{ _key: "hero", _type: "homeHero" }, busMap("home")] },
  { _id: "wf-page-contact", _type: "page", _rev: "r2", title: "Contact & Enrollment", blocks: [busMap("contact")] },
  {
    _id: "drafts.wf-page-contact",
    _type: "page",
    _rev: "r3",
    title: "Contact & Enrollment (draft)",
    blocks: [busMap("contact", { title: "Free bus, edited" })],
  },
  { _id: "wf-page-bus", _type: "page", _rev: "r4", title: "Free Bus Transportation", blocks: [mapEmbed] },
  { _id: "settings", _type: "settings", _rev: "r5" },
];

const plan = planMigration(migration, documents);
const changed = (id) => plan.changed.find((change) => change.before._id === id);

test("the map URL is removed from every bus map section, draft and published alike", () => {
  assert.deepEqual(plan.created, []);
  assert.deepEqual(plan.deleted, []);
  assert.deepEqual(
    plan.changed.map((change) => change.before._id).sort(),
    ["drafts.wf-page-contact", "homePage", "wf-page-contact"],
  );
  for (const { after } of plan.changed) {
    const section = after.blocks.find((block) => block._type === "busMap");
    assert.equal("embedUrl" in section, false);
    assert.equal(section.title.startsWith("Free"), true, "the section keeps its text");
    assert.deepEqual(section.cards, [{ _key: "c1", title: "Free" }]);
  }
});

test("each version keeps its state and its own edits", () => {
  assert.equal(changed("drafts.wf-page-contact").after._id, "drafts.wf-page-contact");
  assert.equal(changed("drafts.wf-page-contact").after.blocks[0].title, "Free bus, edited");
  assert.equal(changed("wf-page-contact").after._id, "wf-page-contact");
  assert.equal(changed("homePage").after.blocks[0]._type, "homeHero");
});

test("embed sections keep their map URL", () => {
  assert.equal(changed("wf-page-bus"), undefined);
});

test("a second run changes nothing", () => {
  const after = documents.map((document) => changed(document._id)?.after ?? document);
  assert.ok(isEmpty(planMigration(migration, after)));
});
