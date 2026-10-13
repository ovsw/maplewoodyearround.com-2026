// Issue #87: the camp's own pin on the live Snazzy bus map (embed 661063)
// becomes the Camp location in Global Settings. The #85 import left this pin
// out of the Bus stops on purpose. The position is the Snazzy one, exactly;
// the name is the camp's full name. The published Global Settings gets it, so
// the map shows the camp at once, and so does a draft of Global Settings, so
// that publishing the draft later does not remove it. A Camp location an
// editor already filled in, even in part, stays as it is.

import { CAMP_PIN_NAME, SNAPSHOT, cleanLines } from "./issue-85-bus-stops.mjs";
import { recordId } from "../lib/migration.mjs";

export const CAMP_NAME = "Maplewood Day Camp and Enrichment Center";
const SETTINGS_ID = "settings";

/** The Camp location from the camp's Snazzy pin. */
export function campLocationFromSnapshot(snapshot) {
  const pins = snapshot.pins.filter((pin) => cleanLines(pin.lines)[0] === CAMP_PIN_NAME);
  if (pins.length !== 1) throw new Error(`The snapshot has ${pins.length} camp pins, not 1`);
  const [pin] = pins;
  if (!Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) throw new Error("The camp pin has no position");
  return {
    _type: "campLocation",
    name: CAMP_NAME,
    address: cleanLines(pin.lines).join(", "),
    location: { _type: "geopoint", lat: pin.lat, lng: pin.lng },
  };
}

const hasCampLocation = (document) =>
  Object.entries(document.campLocation ?? {}).some(([key, value]) => key !== "_type" && value != null);

export default {
  description: "Issue #87: the camp's Snazzy pin becomes the published Camp location in Global Settings.",

  prepare(dataset) {
    if (!dataset.get(SETTINGS_ID)) throw new Error("There is no published Global Settings document");
    const campLocation = campLocationFromSnapshot(SNAPSHOT);
    const versions = dataset.documents.filter(
      (document) => document._type === "settings" && recordId(document._id) === SETTINGS_ID,
    );
    for (const version of versions)
      dataset.note(
        hasCampLocation(version)
          ? `${version._id} has a Camp location already and stays as it is.`
          : `${version._id}: Camp location "${campLocation.name}" at ${campLocation.location.lat}, ${campLocation.location.lng}.`,
      );

    return (document) =>
      document._type === "settings" && recordId(document._id) === SETTINGS_ID && !hasCampLocation(document)
        ? { ...document, campLocation: structuredClone(campLocation) }
        : document;
  },
};
