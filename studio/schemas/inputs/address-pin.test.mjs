import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAddressPinEvent,
  offersMovePin,
  roundPoint,
  storedChanges,
  toPinPoint,
} from "./address-pin.ts";

const camp = { lat: 42.0075788, lng: -71.0734431 };
const corner = { lat: 42.0461198, lng: -71.1227898 };
const town = { lat: 42.0303, lng: -71.1286 };

const empty = { address: "", pin: null, pending: null };
const placed = { address: "Easton, MA 02356", pin: camp, pending: null };

test("no pin plus a picked address places the pin", () => {
  const after = applyAddressPinEvent(empty, {
    type: "pickAddress",
    address: "Summer St & Kimberley Dr, Easton, MA, USA",
    point: corner,
  });
  assert.deepEqual(after, {
    address: "Summer St & Kimberley Dr, Easton, MA, USA",
    pin: corner,
    pending: null,
  });
  assert.equal(offersMovePin(after), false);
  assert.deepEqual(storedChanges(empty, after), {
    address: "Summer St & Kimberley Dr, Easton, MA, USA",
    pin: corner,
  });
});

test("an existing pin plus a changed address keeps the pin and offers the button", () => {
  const after = applyAddressPinEvent(placed, {
    type: "pickAddress",
    address: "Summer St & Kimberley Dr, Easton, MA, USA",
    point: corner,
  });
  assert.deepEqual(after.pin, camp);
  assert.deepEqual(after.pending, corner);
  assert.equal(offersMovePin(after), true);
  // Only the address text is stored; the pin does not move.
  assert.deepEqual(storedChanges(placed, after), {
    address: "Summer St & Kimberley Dr, Easton, MA, USA",
  });
});

test("picking the address the pin already marks offers no button", () => {
  const after = applyAddressPinEvent(placed, {
    type: "pickAddress",
    address: "150 Foundry St, South Easton, MA, USA",
    point: { lat: camp.lat + 1e-9, lng: camp.lng },
  });
  assert.equal(offersMovePin(after), false);
  assert.deepEqual(after.pin, camp);
});

test("the button moves the pin and keeps the address text", () => {
  const offered = applyAddressPinEvent(placed, {
    type: "pickAddress",
    address: "Summer St & Kimberley Dr",
    point: corner,
  });
  const moved = applyAddressPinEvent(offered, { type: "movePinToAddress" });
  assert.deepEqual(moved, { address: "Summer St & Kimberley Dr", pin: corner, pending: null });
  assert.equal(offersMovePin(moved), false);
  assert.deepEqual(storedChanges(offered, moved), { pin: corner });

  // Without a picked address the button does nothing.
  assert.equal(applyAddressPinEvent(placed, { type: "movePinToAddress" }), placed);
});

test("dragging the pin never changes the address text", () => {
  const dragged = applyAddressPinEvent(placed, { type: "dragPin", point: corner });
  assert.equal(dragged.address, "Easton, MA 02356");
  assert.deepEqual(dragged.pin, corner);
  assert.deepEqual(storedChanges(placed, dragged), { pin: corner });

  // A picked address still waits for the button after a drag.
  const offered = applyAddressPinEvent(placed, { type: "pickAddress", address: "Easton", point: town });
  const draggedAfterPick = applyAddressPinEvent(offered, { type: "dragPin", point: corner });
  assert.equal(draggedAfterPick.address, "Easton");
  assert.deepEqual(draggedAfterPick.pending, town);
});

test("when Google cannot find a corner, the editor picks the town and drags the pin", () => {
  const atTown = applyAddressPinEvent(empty, { type: "pickAddress", address: "Easton, MA, USA", point: town });
  assert.deepEqual(atTown.pin, town);
  const edited = applyAddressPinEvent(atTown, { type: "editAddress", address: "Bay Rd & Fairfield Dr" });
  const dragged = applyAddressPinEvent(edited, { type: "dragPin", point: corner });
  assert.deepEqual(dragged, { address: "Bay Rd & Fairfield Dr", pin: corner, pending: null });
});

test("typing in the address field changes only the text", () => {
  const typed = applyAddressPinEvent(placed, { type: "editAddress", address: "Easton, MA" });
  assert.deepEqual(typed, { address: "Easton, MA", pin: camp, pending: null });
  assert.deepEqual(storedChanges(placed, typed), { address: "Easton, MA" });
});

test("removing the pin clears the pin and the offer", () => {
  const offered = applyAddressPinEvent(placed, { type: "pickAddress", address: "Easton", point: town });
  const removed = applyAddressPinEvent(offered, { type: "removePin" });
  assert.deepEqual(removed, { address: "Easton", pin: null, pending: null });
  assert.deepEqual(storedChanges(offered, removed), { pin: null });
});

test("pins are rounded to seven decimals", () => {
  assert.deepEqual(roundPoint({ lat: 42.046119812345, lng: -71.122789887654 }), {
    lat: 42.0461198,
    lng: -71.1227899,
  });
  const dragged = applyAddressPinEvent(empty, { type: "dragPin", point: { lat: 42.046119812345, lng: -71.1 } });
  assert.deepEqual(dragged.pin, { lat: 42.0461198, lng: -71.1 });
});

test("stored geopoints become pins only when both numbers are usable", () => {
  assert.deepEqual(toPinPoint({ _type: "geopoint", lat: 42, lng: -71, alt: 3 }), { lat: 42, lng: -71 });
  assert.equal(toPinPoint(undefined), null);
  assert.equal(toPinPoint({ lat: 42 }), null);
  assert.equal(toPinPoint({ lat: Number.NaN, lng: -71 }), null);
  assert.equal(toPinPoint("42,-71"), null);
});
