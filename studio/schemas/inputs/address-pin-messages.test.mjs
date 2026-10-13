import assert from "node:assert/strict";
import test from "node:test";

import { addressPinStatusMessage, initialGoogleMapsStatus } from "./address-pin-messages.ts";

test("a Studio without a Google Maps key says so at once", () => {
  assert.equal(initialGoogleMapsStatus(undefined), "missing-key");
  assert.equal(initialGoogleMapsStatus("  "), "missing-key");
  assert.equal(initialGoogleMapsStatus("key"), "loading");
  assert.match(addressPinStatusMessage("missing-key"), /this Studio has no Google Maps key/);
  assert.match(addressPinStatusMessage("missing-key"), /You can still type the address/);
});

test("a refused key and a failed script each have a clear message", () => {
  assert.match(addressPinStatusMessage("refused"), /Google refused this Studio's Maps key/);
  assert.match(addressPinStatusMessage("refused"), /daily limit/);
  assert.match(addressPinStatusMessage("failed"), /The map could not load/);
});

test("a working input shows no message", () => {
  assert.equal(addressPinStatusMessage("loading"), null);
  assert.equal(addressPinStatusMessage("ready"), null);
});
