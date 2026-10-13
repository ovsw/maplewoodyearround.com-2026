/*
 * The bus map model: the one seam the bus map and the stop list both read.
 *
 * Pure: the same Bus stops and Camp location always give the same model.
 * A stop shows when its "shown on map" switch is not off and it has a pin.
 * Stops sort by town, then by name, without case. Google Maps links are
 * built from the pin's coordinates, never from the address text, so they
 * point where the pin is. With no shown stops the model is empty, camp
 * included: the map then shows its "not available" message.
 */

export type BusMapPoint = { lat: number; lng: number };

export type BusStopInput = {
  _id: string;
  name?: string | null;
  address?: string | null;
  town?: string | null;
  location?: { lat?: number | null; lng?: number | null } | null;
  shownOnMap?: boolean | null;
};

export type CampLocationInput = {
  name?: string | null;
  address?: string | null;
  location?: { lat?: number | null; lng?: number | null } | null;
};

export type BusStopPin = {
  id: string;
  name: string;
  address: string;
  town: string;
  position: BusMapPoint;
  /** "View in Google Maps": the place at the pin's coordinates. */
  googleMapsUrl: string;
};

export type CampPin = {
  name: string;
  address: string;
  position: BusMapPoint;
  /** "Get directions": driving directions to the camp's coordinates. */
  directionsUrl: string;
};

export type BusTownGroup = { town: string; stops: BusStopPin[] };

export type BusMapModel = {
  /** Every shown stop with a pin, by town, then by name. */
  stops: BusStopPin[];
  camp: CampPin | null;
  /** The same stops grouped by town, towns A to Z. */
  towns: BusTownGroup[];
};

export const EMPTY_BUS_MAP: BusMapModel = { stops: [], camp: null, towns: [] };

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

function pointOf(
  location: BusStopInput["location"],
): BusMapPoint | null {
  const lat = location?.lat;
  const lng = location?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

const coordinates = ({ lat, lng }: BusMapPoint) => `${lat},${lng}`;

export function googleMapsPlaceUrl(point: BusMapPoint): string {
  return `https://www.google.com/maps/search/?api=1&query=${coordinates(point)}`;
}

export function googleMapsDirectionsUrl(point: BusMapPoint): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${coordinates(point)}`;
}

function stopPin(stop: BusStopInput): BusStopPin | null {
  if (stop.shownOnMap === false) return null;
  const position = pointOf(stop.location);
  const name = stop.name?.trim();
  if (!position || !name) return null;
  return {
    id: stop._id,
    name,
    address: stop.address?.trim() ?? "",
    town: stop.town?.trim() ?? "",
    position,
    googleMapsUrl: googleMapsPlaceUrl(position),
  };
}

function campPin(camp: CampLocationInput | null | undefined): CampPin | null {
  const position = pointOf(camp?.location);
  if (!camp || !position) return null;
  return {
    name: camp.name?.trim() ?? "",
    address: camp.address?.trim() ?? "",
    position,
    directionsUrl: googleMapsDirectionsUrl(position),
  };
}

export function buildBusMapModel(
  stops: readonly BusStopInput[] | null | undefined,
  camp?: CampLocationInput | null,
): BusMapModel {
  const pins = (stops ?? [])
    .map(stopPin)
    .filter((pin): pin is BusStopPin => pin !== null)
    .sort(
      (a, b) =>
        collator.compare(a.town, b.town) ||
        collator.compare(a.name, b.name) ||
        collator.compare(a.id, b.id),
    );
  if (!pins.length) return EMPTY_BUS_MAP;

  const towns: BusTownGroup[] = [];
  for (const pin of pins) {
    const current = towns.at(-1);
    if (current && collator.compare(current.town, pin.town) === 0)
      current.stops.push(pin);
    else towns.push({ town: pin.town, stops: [pin] });
  }
  return { stops: pins, camp: campPin(camp), towns };
}
