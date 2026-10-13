import assert from "node:assert/strict";
import test from "node:test";
import { isEmpty, planMigration } from "../lib/migration.mjs";
import migration, { CAMP_NAME, campLocationFromSnapshot } from "./issue-87-camp-location.mjs";
import { SNAPSHOT } from "./issue-85-bus-stops.mjs";

const settings = { _id: "settings", _type: "settings", _rev: "r1", siteName: "Maplewood" };
const stop = { _id: "bus-stop-gilmore-hall", _type: "busStop", _rev: "r1", name: "Gilmore Hall" };

const expected = {
  _type: "campLocation",
  name: "Maplewood Day Camp and Enrichment Center",
  address: "150 Foundry St #106, South Easton, MA",
  location: { _type: "geopoint", lat: 42.0075788, lng: -71.0734431 },
};

test("the camp's Snazzy pin gives the Camp location, with its exact position", () => {
  assert.equal(CAMP_NAME, "Maplewood Day Camp and Enrichment Center");
  assert.deepEqual(campLocationFromSnapshot(SNAPSHOT), expected);
  assert.throws(() => campLocationFromSnapshot({ pins: [] }), /0 camp pins/);
});

test("the published Global Settings gets the Camp location, and nothing else changes", () => {
  const plan = planMigration(migration, [settings, stop]);
  assert.deepEqual(plan.created, []);
  assert.deepEqual(plan.deleted, []);
  assert.equal(plan.changed.length, 1);
  const [change] = plan.changed;
  assert.equal(change.before._id, "settings");
  assert.deepEqual(change.set, { campLocation: expected });
  assert.deepEqual(change.unset, []);
  assert.deepEqual(plan.notes, [
    'settings: Camp location "Maplewood Day Camp and Enrichment Center" at 42.0075788, -71.0734431.',
  ]);
});

test("a draft of Global Settings gets it too and stays a draft", () => {
  const draft = { ...settings, _id: "drafts.settings", siteName: "Maplewood Day Camp" };
  const plan = planMigration(migration, [settings, draft]);
  assert.deepEqual(
    plan.changed.map((change) => [change.after._id, change.after.siteName, change.after.campLocation]),
    [
      ["settings", "Maplewood", expected],
      ["drafts.settings", "Maplewood Day Camp", expected],
    ],
  );
});

test("a second run changes nothing, and an editor's Camp location stays", () => {
  const plan = planMigration(migration, [settings]);
  const afterRun = [{ ...plan.changed[0].after, _rev: "r2" }];
  assert.ok(isEmpty(planMigration(migration, afterRun)));

  // An editor moved the pin in the draft and cleared the name: it stays.
  const edited = {
    ...afterRun[0],
    _id: "drafts.settings",
    campLocation: { _type: "campLocation", location: { _type: "geopoint", lat: 42.01, lng: -71.07 } },
  };
  const second = planMigration(migration, [...afterRun, edited]);
  assert.ok(isEmpty(second));
  assert.match(second.notes.at(-1), /^drafts\.settings has a Camp location already/);
});

test("the run stops when there is no published Global Settings", () => {
  assert.throws(() => planMigration(migration, [stop]), /no published Global Settings/);
});
