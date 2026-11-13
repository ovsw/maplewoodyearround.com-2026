import assert from "node:assert/strict";
import test from "node:test";
import { directionsLink } from "./directions-link.ts";

test("links to Google Maps directions to the pin's coordinates", () => {
  assert.equal(
    directionsLink({ _type: "geopoint", lat: 42.084084, lng: -71.212801 }),
    "https://www.google.com/maps/dir/?api=1&destination=42.084084,-71.212801",
  );
});

test("has no link for a stop without a whole pin", () => {
  assert.equal(directionsLink(undefined), null);
  assert.equal(directionsLink(null), null);
  assert.equal(directionsLink({ lat: 42.08 }), null);
  assert.equal(directionsLink({ lat: "42.08", lng: "-71.21" }), null);
  assert.equal(directionsLink({ lat: Number.NaN, lng: -71.21 }), null);
});
