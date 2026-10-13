import { describe, expect, it } from "vitest";
import { buildBusMapModel, EMPTY_BUS_MAP, type BusStopInput } from "./bus-map-model";

function stop(
  id: string,
  name: string,
  town: string,
  location: BusStopInput["location"] = { lat: 42.05, lng: -71.13 },
  extra: Partial<BusStopInput> = {},
): BusStopInput {
  return { _id: id, name, address: `${town}, MA 02356`, town, location, shownOnMap: true, ...extra };
}

const camp = {
  name: "Maplewood Day Camp and Enrichment Center",
  address: "150 Foundry St #106, South Easton, MA",
  location: { lat: 42.0075788, lng: -71.0734431 },
};

const ids = (model: ReturnType<typeof buildBusMapModel>) => model.stops.map((pin) => pin.id);

describe("buildBusMapModel", () => {
  it("leaves out hidden stops and stops without a pin", () => {
    const model = buildBusMapModel([
      stop("shown", "Bay Rd & Fairfield Dr", "Easton"),
      stop("hidden", "Bay Rd & Kingsley Rd", "Easton", undefined, { shownOnMap: false }),
      stop("no-pin", "Gaslight Ln", "Easton", null),
      stop("half-pin", "Heidi Rd & Highland St", "Easton", { lat: 42.02, lng: null }),
      // The switch is on by default, so a stop without a value shows.
      stop("default", "Gilmore Hall", "Raynham", undefined, { shownOnMap: undefined }),
    ]);

    expect(ids(model)).toEqual(["shown", "default"]);
  });

  it("sorts by town, then by name, and groups the stops by town", () => {
    const model = buildBusMapModel([
      stop("s2", "Pine Grove Ave & Woods Way", "Sharon"),
      stop("e2", "foundry St & Walden Dr", "Easton"),
      stop("ne", "148 Allen Rd", "North Easton"),
      stop("e1", "Bay Rd & Evans Cir", "Easton"),
      stop("s1", "181 Pond St", "Sharon"),
      stop("s3", "45 Wilshire Dr", "Sharon"),
    ]);

    expect(ids(model)).toEqual(["e1", "e2", "ne", "s3", "s1", "s2"]);
    expect(model.towns.map((group) => [group.town, group.stops.map((pin) => pin.id)])).toEqual([
      ["Easton", ["e1", "e2"]],
      ["North Easton", ["ne"]],
      ["Sharon", ["s3", "s1", "s2"]],
    ]);
  });

  it("builds the Google Maps links from the coordinates, not the address", () => {
    const model = buildBusMapModel(
      [stop("lowes", "Lowe's Home Improvement", "Plainville", { lat: 42.028885, lng: -71.309013 })],
      camp,
    );

    expect(model.stops[0]).toEqual({
      id: "lowes",
      name: "Lowe's Home Improvement",
      address: "Plainville, MA 02356",
      town: "Plainville",
      position: { lat: 42.028885, lng: -71.309013 },
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=42.028885,-71.309013",
    });
    expect(model.camp).toEqual({
      name: "Maplewood Day Camp and Enrichment Center",
      address: "150 Foundry St #106, South Easton, MA",
      position: { lat: 42.0075788, lng: -71.0734431 },
      directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=42.0075788,-71.0734431",
    });
  });

  it("has no camp pin when the Camp location is empty", () => {
    const stops = [stop("e1", "Bay Rd & Evans Cir", "Easton")];

    expect(buildBusMapModel(stops).camp).toBeNull();
    expect(buildBusMapModel(stops, null).camp).toBeNull();
    expect(buildBusMapModel(stops, { name: "Maplewood", location: null }).camp).toBeNull();
  });

  it("gives an empty model for an empty input or no shown stops", () => {
    expect(buildBusMapModel([])).toEqual(EMPTY_BUS_MAP);
    expect(buildBusMapModel(null, camp)).toEqual(EMPTY_BUS_MAP);
    expect(
      buildBusMapModel([stop("hidden", "Gaslight Ln", "Easton", undefined, { shownOnMap: false })], camp),
    ).toEqual({ stops: [], camp: null, towns: [] });
  });
});
