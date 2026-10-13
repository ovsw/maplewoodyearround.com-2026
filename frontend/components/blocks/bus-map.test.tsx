import { act, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildBusMapModel, type BusStopInput } from "@/lib/bus-map-model";
import type { BusMapLibraries } from "@/lib/google-maps";
import BusMap from "./bus-map";
import BusStopMap, {
  BUS_MAP_UNAVAILABLE,
  BUS_STOP_PIN_SRC,
  type BusMapServices,
} from "./bus-stop-map";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const stopInputs: BusStopInput[] = [
  {
    _id: "bus-stop-gilmore-hall",
    name: "Gilmore Hall",
    address: "964 Broadway, Raynham, MA 02767",
    town: "Raynham",
    location: { lat: 41.954462, lng: -71.070689 },
    shownOnMap: true,
  },
  {
    _id: "bus-stop-gavins-pond",
    name: "Gavins Pond Soccer Fields",
    address: "120 Gavins Pond Rd, Sharon, MA 02067",
    town: "Sharon",
    location: { lat: 42.084084, lng: -71.212801 },
    shownOnMap: true,
  },
];
const stops = buildBusMapModel(stopInputs).stops;

/** Holds the IntersectionObserver callback so a test can scroll the map near. */
function viewport() {
  let intersect: (entries: { isIntersecting: boolean }[]) => void = () => {};
  const options: IntersectionObserverInit[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(
        callback: typeof intersect,
        init: IntersectionObserverInit = {},
      ) {
        intersect = callback;
        options.push(init);
      }
      observe() {}
      disconnect() {}
    },
  );
  return {
    options,
    near: () => act(() => intersect([{ isIntersecting: true }])),
  };
}

/** A stand-in for Google that records what the map was asked to draw. */
function fakeGoogle() {
  const drawn = {
    mapOptions: undefined as google.maps.MapOptions | undefined,
    fitted: [] as google.maps.LatLngLiteral[],
    markers: [] as FakeMarker[],
    popups: [] as HTMLElement[],
  };
  class FakeMarker {
    options: google.maps.marker.AdvancedMarkerElementOptions;
    map: unknown;
    clicks: (() => void)[] = [];
    constructor(options: google.maps.marker.AdvancedMarkerElementOptions) {
      this.options = options;
      this.map = options.map;
      drawn.markers.push(this);
    }
    addEventListener(event: string, listener: () => void) {
      if (event === "gmp-click") this.clicks.push(listener);
    }
  }
  class FakeMap {
    constructor(_element: HTMLElement, options: google.maps.MapOptions) {
      drawn.mapOptions = options;
    }
    fitBounds(bounds: { points: google.maps.LatLngLiteral[] }) {
      drawn.fitted = bounds.points;
    }
    setCenter() {}
    setZoom() {}
  }
  class FakeInfoWindow {
    content: HTMLElement | null = null;
    setContent(content: HTMLElement) {
      this.content = content;
    }
    open() {
      if (this.content) drawn.popups.push(this.content);
    }
    close() {}
  }
  class FakeBounds {
    points: google.maps.LatLngLiteral[] = [];
    extend(point: google.maps.LatLngLiteral) {
      this.points.push(point);
    }
  }
  const libraries = {
    Map: FakeMap,
    InfoWindow: FakeInfoWindow,
    LatLngBounds: FakeBounds,
    AdvancedMarkerElement: FakeMarker,
  } as unknown as BusMapLibraries;
  return { drawn, libraries };
}

function services(load: BusMapServices["load"]) {
  let refuse = () => {};
  const value: BusMapServices = {
    load: vi.fn(load),
    onAuthFailure: (listener) => {
      refuse = listener;
      return () => {
        refuse = () => {};
      };
    },
  };
  return { value, refuse: () => act(() => refuse()) };
}

const unavailable = () => screen.findByText(BUS_MAP_UNAVAILABLE);

describe("BusStopMap", () => {
  it("loads Google only when the map comes near the viewport", async () => {
    const view = viewport();
    const { libraries } = fakeGoogle();
    const google = services(async () => libraries);
    render(
      <BusStopMap stops={stops} apiKey="key" mapId="map" services={google.value} />,
    );
    expect(google.value.load).not.toHaveBeenCalled();
    expect(view.options[0].rootMargin).toBeTruthy();
    view.near();
    await waitFor(() => expect(google.value.load).toHaveBeenCalledWith("key"));
  });

  it("draws one green M pin per stop, fits them all and never zooms on page scroll", async () => {
    const view = viewport();
    const { drawn, libraries } = fakeGoogle();
    render(
      <BusStopMap
        stops={stops}
        apiKey="key"
        mapId="map-id"
        services={services(async () => libraries).value}
      />,
    );
    view.near();
    await waitFor(() => expect(drawn.markers).toHaveLength(2));
    expect(drawn.mapOptions).toMatchObject({
      mapId: "map-id",
      gestureHandling: "cooperative",
    });
    expect(drawn.fitted).toEqual(stops.map((stop) => stop.position));
    for (const marker of drawn.markers) {
      const pin = marker.options.content as HTMLImageElement;
      expect(pin.getAttribute("src")).toBe(BUS_STOP_PIN_SRC);
      expect(pin.width).toBe(40);
    }
    expect(drawn.markers.map((marker) => marker.options.title)).toEqual([
      "Gilmore Hall",
      "Gavins Pond Soccer Fields",
    ]);
  });

  it("opens a popup with the name, the address and a Google Maps link to the pin", async () => {
    const view = viewport();
    const { drawn, libraries } = fakeGoogle();
    render(
      <BusStopMap
        stops={stops}
        apiKey="key"
        mapId="map"
        services={services(async () => libraries).value}
      />,
    );
    view.near();
    await waitFor(() => expect(drawn.markers).toHaveLength(2));
    act(() => drawn.markers[1].clicks.forEach((click) => click()));
    const [popup] = drawn.popups;
    expect(popup.textContent).toContain("Gavins Pond Soccer Fields");
    expect(popup.textContent).toContain("120 Gavins Pond Rd, Sharon, MA 02067");
    const link = popup.querySelector("a");
    expect(link?.textContent).toBe("View in Google Maps");
    expect(link?.getAttribute("href")).toBe(
      "https://www.google.com/maps/search/?api=1&query=42.084084,-71.212801",
    );
    expect(link?.getAttribute("rel")).toContain("noopener");
  });

  it("shows the message when there is no key or no Map ID", async () => {
    viewport();
    const { rerender } = render(<BusStopMap stops={stops} mapId="map" />);
    expect(await unavailable()).toBeVisible();
    rerender(<BusStopMap stops={stops} apiKey="key" mapId="" />);
    expect(await unavailable()).toBeVisible();
  });

  it("shows the message when there are no shown stops", async () => {
    viewport();
    render(<BusStopMap stops={[]} apiKey="key" mapId="map" />);
    expect(await unavailable()).toBeVisible();
    expect(screen.getByRole("status")).toBeVisible();
  });

  it("shows the message when the Google script fails to load", async () => {
    const view = viewport();
    render(
      <BusStopMap
        stops={stops}
        apiKey="key"
        mapId="map"
        services={services(() => Promise.reject(new Error("offline"))).value}
      />,
    );
    expect(screen.queryByText(BUS_MAP_UNAVAILABLE)).toBeNull();
    view.near();
    expect(await unavailable()).toBeVisible();
  });

  it("shows the message when Google refuses the request", async () => {
    const view = viewport();
    const { libraries } = fakeGoogle();
    const google = services(async () => libraries);
    render(
      <BusStopMap stops={stops} apiKey="key" mapId="map" services={google.value} />,
    );
    view.near();
    await waitFor(() => expect(google.value.load).toHaveBeenCalled());
    google.refuse();
    expect(await unavailable()).toBeVisible();
  });
});

describe("BusMap section", () => {
  const section = (
    props: { stops?: BusStopInput[] } = {},
  ): ComponentProps<typeof BusMap> =>
    ({
      _key: "bus",
      _type: "busMap",
      title: "Free Bus Transportation",
      eyebrow: "Getting here",
      description: "Free bus service from Sharon, Easton and Raynham.",
      cards: [],
      actions: [],
      stops: stopInputs,
      ...props,
    }) as unknown as ComponentProps<typeof BusMap>;

  it("keeps the section text and shows the map area when stops and a key exist", () => {
    viewport();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "key");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID", "map");
    render(<BusMap {...section()} />);
    expect(
      screen.getByRole("heading", { name: "Free Bus Transportation" }),
    ).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Map of the summer bus stops" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(BUS_MAP_UNAVAILABLE)).toBeNull();
  });

  it("shows the message when no stop is shown on the map", async () => {
    viewport();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "key");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID", "map");
    const hidden = stopInputs.map((stop) => ({ ...stop, shownOnMap: false }));
    render(<BusMap {...section({ stops: hidden })} />);
    expect(await unavailable()).toBeVisible();
  });

  it("shows the message when the website key is missing", async () => {
    viewport();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID", "map");
    render(<BusMap {...section()} />);
    expect(await unavailable()).toBeVisible();
  });
});
