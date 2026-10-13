import assert from "node:assert/strict";
import test from "node:test";

import { distanceKm, farFromCampMessage, MAX_KM_FROM_CAMP, nearCamp } from "./near-camp.ts";

const camp = { lat: 42.0075788, lng: -71.0734431 };

function createContext(fetched) {
  const calls = [];
  return {
    calls,
    getClient: () => ({
      withConfig: (config) => ({
        fetch: async (query) => {
          calls.push({ perspective: config.perspective, query });
          return fetched;
        },
      }),
    }),
  };
}

test("distances between pins are in kilometres", () => {
  assert.equal(distanceKm(camp, camp), 0);
  // Gilmore Hall in Raynham is about 6 km south of the camp.
  const gilmore = distanceKm(camp, { lat: 41.954462, lng: -71.070689 });
  assert.ok(gilmore > 5 && gilmore < 7, `${gilmore}`);
});

test("real stops near the camp pass", () => {
  assert.equal(MAX_KM_FROM_CAMP, 80);
  // Lowe's in Plainville is the farthest imported stop, about 20 km away.
  assert.equal(farFromCampMessage({ lat: 42.028885, lng: -71.309013 }, camp), true);
  // Boston is about 35 km away: still near enough.
  assert.equal(farFromCampMessage({ lat: 42.3601, lng: -71.0589 }, camp), true);
});

test("a pin in another state or country warns with the distance", () => {
  // The Snazzy duplicate with a lost minus sign lands in Asia.
  assert.match(
    farFromCampMessage({ lat: 42.0856502, lng: 71.1931949 }, camp),
    /^This pin is about \d+ km from the camp\. Check the latitude and longitude/,
  );
  // New York City is about 290 km away.
  assert.match(farFromCampMessage({ lat: 40.7128, lng: -74.006 }, camp), /about 2\d\d km/);
});

test("no pin or no Camp location means no warning", () => {
  assert.equal(farFromCampMessage(undefined, camp), true);
  assert.equal(farFromCampMessage({ lat: 42, lng: null }, camp), true);
  assert.equal(farFromCampMessage({ lat: 40.7128, lng: -74.006 }, null), true);
  assert.equal(farFromCampMessage({ lat: 40.7128, lng: -74.006 }, { lat: null, lng: null }), true);
});

test("the Studio check compares with the published Camp location", async () => {
  const far = createContext(camp);
  assert.match(await nearCamp({ lat: 40.7128, lng: -74.006 }, far), /km from the camp/);
  assert.equal(far.calls[0].perspective, "published");
  assert.match(far.calls[0].query, /campLocation\.location/);

  assert.equal(await nearCamp({ lat: 42.03, lng: -71.13 }, createContext(camp)), true);
  assert.equal(await nearCamp({ lat: 40.7128, lng: -74.006 }, createContext(null)), true);

  // Without a pin there is nothing to check, and nothing is fetched.
  const empty = createContext(camp);
  assert.equal(await nearCamp(undefined, empty), true);
  assert.equal(empty.calls.length, 0);
});
