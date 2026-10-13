import assert from "node:assert/strict";
import test from "node:test";
import { isEmpty, planMigration } from "../lib/migration.mjs";
import migration from "./issue-88-bus-page-map.mjs";

const TOWNS =
  "These are our centralized pick-up and drop-off locations for our free bus transportation,\nserving Easton, Sharon and Mansfield.";
const mapEmbed = (extra = {}) => ({
  _key: "bus-map-3",
  _type: "embedSection",
  actions: [],
  anchorId: "bus-map",
  background: "cream",
  description: TOWNS,
  embedUrl: "https://snazzymaps.com/embed/661063",
  frameTitle: "Bus Stop Map",
  provider: "Map",
  title: "Bus Stop Map",
  ...extra,
});
const cognito = { _key: "tour", _type: "embedSection", provider: "Cognito", providerId: "5", accountId: "a" };
const homeBusMap = { _key: "home", _type: "busMap", title: "Free Bus Transportation" };

const documents = [
  { _id: "wf-page-bus", _type: "page", _rev: "r1", title: "Free Bus Transportation", blocks: [{ _key: "hero", _type: "innerHero" }, mapEmbed()] },
  {
    _id: "drafts.wf-page-bus",
    _type: "page",
    _rev: "r2",
    title: "Free Bus Transportation",
    blocks: [mapEmbed({ title: "Bus Stop Map, edited" })],
  },
  { _id: "wf-page-tour", _type: "page", _rev: "r3", title: "Tour", blocks: [cognito] },
  { _id: "homePage", _type: "homePage", _rev: "r4", blocks: [homeBusMap] },
];

const plan = planMigration(migration, documents);
const changed = (id) => plan.changed.find((change) => change.before._id === id);

test("the Map embed becomes a bus map section with the stop list, draft and published alike", () => {
  assert.deepEqual(plan.created, []);
  assert.deepEqual(plan.deleted, []);
  assert.deepEqual(plan.changed.map((change) => change.before._id).sort(), ["drafts.wf-page-bus", "wf-page-bus"]);
  assert.deepEqual(changed("wf-page-bus").after.blocks[1], {
    _key: "bus-map-3",
    _type: "busMap",
    anchorId: "bus-map",
    background: "cream",
    title: "Bus Stop Map",
    description: TOWNS,
    showStopList: true,
  });
});

test("each version keeps its state, its order and its own edits", () => {
  const draft = changed("drafts.wf-page-bus").after;
  assert.equal(draft._id, "drafts.wf-page-bus");
  assert.equal(draft.blocks[0].title, "Bus Stop Map, edited");
  const published = changed("wf-page-bus").after;
  assert.equal(published._id, "wf-page-bus");
  assert.equal(published.blocks[0]._type, "innerHero");
});

test("other embed providers and existing bus map sections do not change", () => {
  assert.equal(changed("wf-page-tour"), undefined);
  assert.equal(changed("homePage"), undefined);
});

test("buttons on the Map embed stay", () => {
  const action = { _key: "a1", _type: "contentAction", label: "Call us" };
  const result = planMigration(migration, [
    { _id: "p", _type: "page", _rev: "r", blocks: [mapEmbed({ actions: [action] })] },
  ]);
  assert.deepEqual(result.changed[0].after.blocks[0].actions, [action]);
});

test("the run stops when a Map embed holds content the bus map cannot keep", () => {
  const body = [{ _key: "b", _type: "block", children: [{ _type: "span", text: "Note" }] }];
  assert.throws(
    () => planMigration(migration, [{ _id: "p", _type: "page", _rev: "r", blocks: [mapEmbed({ body })] }]),
    /bus-map-3 has body/,
  );
});

test("a second run changes nothing", () => {
  const after = documents.map((document) => changed(document._id)?.after ?? document);
  assert.ok(isEmpty(planMigration(migration, after)));
});
