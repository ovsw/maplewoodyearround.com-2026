import type { ValidationContext } from "sanity";

/*
 * A Bus stop pin far from the camp is almost always a typing or dragging
 * mistake: a stop in another state or another country. The check warns and
 * never blocks publishing. It compares with the published Camp location,
 * the one the Website shows; with no Camp location it says nothing.
 */

type Point = { lat?: number | null; lng?: number | null };

/** About 80 km: farther than any real stop from the camp. */
export const MAX_KM_FROM_CAMP = 80;

const EARTH_RADIUS_KM = 6371;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

const usable = (point: Point | null | undefined): point is { lat: number; lng: number } =>
  typeof point?.lat === "number" &&
  typeof point?.lng === "number" &&
  Number.isFinite(point.lat) &&
  Number.isFinite(point.lng);

/** The great-circle distance in kilometres between two pins. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The warning for a pin, or true when the pin is near enough or unknown. */
export function farFromCampMessage(
  pin: Point | null | undefined,
  camp: Point | null | undefined,
): string | true {
  if (!usable(pin) || !usable(camp)) return true;
  const km = distanceKm(pin, camp);
  if (km <= MAX_KM_FROM_CAMP) return true;
  return `This pin is about ${Math.round(km)} km from the camp. Check the latitude and longitude: a minus sign or a digit may be missing.`;
}

export async function nearCamp(value: Point | undefined, context: ValidationContext) {
  if (!usable(value)) return true;
  const camp = await context
    .getClient({ apiVersion: "2026-03-23" })
    .withConfig({ perspective: "published" })
    .fetch<Point | null>(`*[_id == "settings"][0].campLocation.location{lat, lng}`);
  return farFromCampMessage(value, camp);
}
