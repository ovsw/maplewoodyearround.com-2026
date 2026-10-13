import assert from "node:assert/strict";
import test from "node:test";
import { isEmpty, planMigration } from "../lib/migration.mjs";
import migration, { SNAPSHOT, cleanLines, stopId, townFrom } from "./issue-85-bus-stops.mjs";

const existing = [{ _id: "settings", _type: "settings", siteName: "Maplewood" }];
const plan = planMigration(migration, existing);
const stop = (name) => plan.created.find((document) => document.name === name);
const named = (name) => SNAPSHOT.pins.filter((pin) => pin.lines.join(" ").includes(name));

test("the snapshot is the public Snazzy embed with its 57 pins", () => {
  assert.equal(SNAPSHOT.source, "https://snazzymaps.com/embed/661063");
  assert.equal(SNAPSHOT.takenOn, "2026-10-13");
  assert.equal(SNAPSHOT.pins.length, 57);
});

test("the pins become published Bus stops with their exact Snazzy positions", () => {
  // 57 pins, less the camp's own pin and the duplicate plotted in Asia.
  assert.equal(plan.created.length, 55);
  assert.deepEqual(plan.changed, []);
  assert.deepEqual(plan.deleted, []);
  for (const document of plan.created) {
    assert.equal(document._type, "busStop");
    assert.ok(!document._id.startsWith("drafts."), `${document._id} is published`);
    assert.equal(document._id, stopId(document.name));
    assert.equal(document.shownOnMap, true);
    assert.equal(document.location._type, "geopoint");
    const [pin] = SNAPSHOT.pins.filter(
      (item) => item.lat === document.location.lat && item.lng === document.location.lng,
    );
    assert.ok(pin, `${document.name} keeps a Snazzy position`);
    assert.ok(pin.lines.join(" ").includes(document.name), `${document.name} has its own pin`);
  }
  assert.deepEqual(stop("Howard Farm Rd & Knob Hill St").location, {
    _type: "geopoint",
    lat: 42.0701479375866,
    lng: -71.1863423344163,
  });
  assert.deepEqual(stop("Summer St & Kimberley Dr").location, { _type: "geopoint", lat: 42.0461198000001, lng: -71.1227898 });
});

test("the town comes from the address, and stray commas and empty lines are trimmed", () => {
  assert.deepEqual(
    ["Wadsworth Way & Horizons Rd", "Deborah Sampson Tennis Courts", "Howard Farm Rd & Knob Hill St", "148 Allen Rd"].map(
      (name) => [stop(name).name, stop(name).address, stop(name).town],
    ),
    [
      ["Wadsworth Way & Horizons Rd", "Sharon, MA 02067", "Sharon"],
      ["Deborah Sampson Tennis Courts", "30 E Foxboro St, Sharon, MA 02067", "Sharon"],
      ["Howard Farm Rd & Knob Hill St", "Sharon, MA 02067", "Sharon"],
      ["148 Allen Rd", "North Easton, MA 02356", "North Easton"],
    ],
  );
  // A pin with one line holds the name and the address together.
  assert.deepEqual(
    [stop("Wolomolopoag St & Burnt Bridge Rd").address, stop("Wolomolopoag St & Burnt Bridge Rd").town],
    ["Sharon, MA 02067", "Sharon"],
  );
  for (const document of plan.created) {
    for (const text of [document.name, document.address, document.town]) {
      assert.equal(text, text.trim());
      assert.doesNotMatch(text, /,$|\n/);
    }
  }
  assert.deepEqual(cleanLines(["Bay Rd & Button Bush Dr,", "Easton, MA 02356", "\n", " "]), [
    "Bay Rd & Button Bush Dr",
    "Easton, MA 02356",
  ]);
  assert.equal(townFrom("964 Broadway, Raynham, MA 02767"), "Raynham");
  assert.throws(() => townFrom("Somewhere"), /No town/);
});

test("the duplicate stop is imported once, with its negative longitude", () => {
  assert.equal(named("E Foxboro St & King Philip Rd").length, 2);
  const copies = plan.created.filter((document) => document.name === "E Foxboro St & King Philip Rd");
  assert.deepEqual(copies.map((document) => document.location), [
    { _type: "geopoint", lat: 42.0856502, lng: -71.1931949 },
  ]);
  assert.ok(plan.created.every((document) => document.location.lng < 0));
});

test("the camp's own pin is not a Bus stop", () => {
  assert.equal(named("150 Foundry St #106").length, 1);
  assert.ok(plan.created.every((document) => !document.name.includes("Foundry St #106")));
  assert.ok(plan.created.every((document) => document.town !== "South Easton"));
});

test("the doubtful pins are imported unchanged", () => {
  assert.deepEqual(
    ["Lowe's Home Improvement", "Poquanticut Avenue & Roundtable Road"].map((name) => {
      const { address, town, location } = stop(name);
      return [address, town, location.lat, location.lng];
    }),
    [
      ["201 Washington St, Plainville, MA 02762", "Plainville", 42.028885, -71.309013],
      ["201 Washington St, Plainville, MA 02762", "Plainville", 42.030937, -71.131859],
    ],
  );
});

test("the plan names what it leaves out", () => {
  assert.deepEqual(plan.notes.slice(0, 3), [
    "Snazzy snapshot of 2026-10-13: 57 pins, 55 Bus stops.",
    'Left out "E Foxboro St & King Philip Rd" at 42.0856502, 71.1931949: duplicate with the wrong longitude',
    'Left out "150 Foundry St #106" at 42.0075788, -71.0734431: the camp itself, not a Bus stop',
  ]);
});

test("ids are stable, and a second run changes nothing, even after editors change a stop", () => {
  assert.equal(stopId("Lowe's Home Improvement"), "bus-stop-lowes-home-improvement");
  assert.equal(stopId("Bay Rd & Fairfield Dr"), "bus-stop-bay-rd-and-fairfield-dr");
  assert.deepEqual(
    planMigration(migration, existing).created.map((document) => document._id),
    plan.created.map((document) => document._id),
  );

  const afterRun = [...existing, ...plan.created.map((document) => ({ ...document, _rev: "r1" }))];
  assert.ok(isEmpty(planMigration(migration, afterRun)));

  // An editor moved a pin, hid a stop and left a draft: nothing is put back.
  const edited = afterRun.map((document) =>
    document._id === "bus-stop-gilmore-hall"
      ? { ...document, shownOnMap: false, location: { _type: "geopoint", lat: 41.95, lng: -71.07 } }
      : document,
  );
  const draftOnly = edited.filter((document) => document._id !== "bus-stop-84-park-st");
  draftOnly.push({ ...stop("84 Park St"), _id: "drafts.bus-stop-84-park-st", name: "84 Park Street" });
  const second = planMigration(migration, draftOnly);
  assert.ok(isEmpty(second));
  assert.match(second.notes.at(-1), /^55 Bus stops exist already/);
});
