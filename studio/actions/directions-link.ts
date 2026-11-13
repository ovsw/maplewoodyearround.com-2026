/*
 * The directions link staff send to a family for one Bus stop. It opens
 * Google Maps with directions to the stop's pin (the Google Maps app on a
 * phone that has it, the browser otherwise) and needs no login. It is built
 * from the pin's coordinates, never the address text, and matches the
 * "Get directions" link in the stop's popup on the bus map
 * (frontend/lib/bus-map-model.ts).
 */

type Pin = { lat?: unknown; lng?: unknown } | null | undefined;

export function directionsLink(pin: Pin): string | null {
  const lat = pin?.lat;
  const lng = pin?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
