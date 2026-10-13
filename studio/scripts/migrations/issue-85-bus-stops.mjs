// Issue #85: the pins of the live Snazzy bus map (embed 661063) become
// published Bus stop records. The source is a committed snapshot of the
// public embed, taken 2026-10-13. Each stop keeps its Snazzy position
// exactly; the town comes from the address. The camp's own pin is not a Bus
// stop (it becomes the Camp location in #87), and the duplicate stop plotted
// in Asia is dropped. Doubtful pins are imported as they are: the editors
// confirm them at the training.

import { readFileSync } from "node:fs";

export const SNAPSHOT = JSON.parse(readFileSync(new URL("./data/snazzy-661063.json", import.meta.url), "utf8"));

/** The pin of the camp itself. It is the Camp location, never a Bus stop. */
export const CAMP_PIN_NAME = "150 Foundry St #106";

/** Popup text lines without stray commas, spaces and empty lines. */
export function cleanLines(lines) {
  return lines
    .flatMap((line) => line.split("\n"))
    .map((line) => line.trim().replace(/[\s,]+$/, ""))
    .filter(Boolean);
}

/** The town of an address such as "30 E Foxboro St, Sharon, MA 02067". */
export function townFrom(address) {
  const parts = address.split(",").map((part) => part.trim());
  const state = parts.findIndex((part) => /^MA\b/.test(part));
  if (state < 1 || !parts[state - 1]) throw new Error(`No town in the address "${address}"`);
  return parts[state - 1];
}

/** A stable id from the stop name: "bus-stop-bay-rd-and-fairfield-dr". */
export function stopId(name) {
  const slug = name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `bus-stop-${slug}`;
}

/** Name and address of one pin. A one-line pin holds both: "Name, Town, MA zip". */
function nameAndAddress(pin) {
  const lines = cleanLines(pin.lines);
  if (lines.length === 2) return { name: lines[0], address: lines[1] };
  const oneLine = lines.length === 1 && /^(.+?),\s*([^,]+,\s*MA\b.*)$/.exec(lines[0]);
  if (oneLine) return { name: oneLine[1], address: oneLine[2] };
  throw new Error(`The pin at ${pin.lat}, ${pin.lng} has ${lines.length} text lines: ${JSON.stringify(pin.lines)}`);
}

/**
 * The Bus stops of a snapshot, sorted by town and name, with the pins left
 * out and why.
 */
export function busStopsFromSnapshot(snapshot) {
  const pins = snapshot.pins.map((pin) => {
    if (!Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) throw new Error(`A pin has no position: ${JSON.stringify(pin)}`);
    return { ...nameAndAddress(pin), lat: pin.lat, lng: pin.lng };
  });
  const leftOut = [];
  const byName = Map.groupBy(pins, (pin) => pin.name);
  const kept = [...byName.values()].flatMap((same) => {
    if (same.length === 1) return same;
    // Maplewood is west of Greenwich: a copy with a positive longitude is a typing error.
    const west = same.filter((pin) => pin.lng < 0);
    if (west.length !== 1) throw new Error(`"${same[0].name}" is pinned ${same.length} times and cannot be told apart`);
    for (const pin of same.filter((item) => item !== west[0]))
      leftOut.push(`"${pin.name}" at ${pin.lat}, ${pin.lng}: duplicate with the wrong longitude`);
    return west;
  });

  const stops = kept
    .filter((pin) => {
      if (pin.name !== CAMP_PIN_NAME) return true;
      leftOut.push(`"${pin.name}" at ${pin.lat}, ${pin.lng}: the camp itself, not a Bus stop`);
      return false;
    })
    .map((pin) => ({
      _id: stopId(pin.name),
      _type: "busStop",
      name: pin.name,
      address: pin.address,
      town: townFrom(pin.address),
      location: { _type: "geopoint", lat: pin.lat, lng: pin.lng },
      shownOnMap: true,
    }))
    .sort((a, b) => a.town.localeCompare(b.town) || a.name.localeCompare(b.name));

  const ids = new Set(stops.map((stop) => stop._id));
  if (ids.size !== stops.length) throw new Error("Two Bus stops would share an id");
  return { stops, leftOut };
}

export default {
  description: "Issue #85: the pins of the live Snazzy bus map become published Bus stops.",

  prepare(dataset) {
    if (SNAPSHOT.pins.length !== 57) throw new Error(`The snapshot holds ${SNAPSHOT.pins.length} pins, not 57`);
    const { stops, leftOut } = busStopsFromSnapshot(SNAPSHOT);
    const present = stops.filter((stop) => dataset.get(stop._id) || dataset.get(`drafts.${stop._id}`));
    for (const stop of stops) if (!present.includes(stop)) dataset.create(stop);

    dataset.note(`Snazzy snapshot of ${SNAPSHOT.takenOn}: ${SNAPSHOT.pins.length} pins, ${stops.length} Bus stops.`);
    for (const line of leftOut) dataset.note(`Left out ${line}`);
    if (present.length)
      dataset.note(`${present.length} Bus stops exist already and stay as they are: ${present.map((stop) => stop._id).join(", ")}`);
    return (document) => document;
  },
};
