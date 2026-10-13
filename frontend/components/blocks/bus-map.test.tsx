import { act, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildBusMapModel,
  type BusStopInput,
  type CampLocationInput,
} from "@/lib/bus-map-model";
import type { BusMapLibraries } from "@/lib/google-maps";
import BusMap from "./bus-map";
import BusStopList, { NO_TOWN, STOP_LIST_SUMMARY } from "./bus-stop-list";
import BusStopMap, {
  BUS_MAP_UNAVAILABLE,
  STOP_LIST_LINK,
  BUS_STOP_PIN_SRC,
  CAMP_PIN_SRC,
  type BusMapServices,
} from "./bus-stop-map";

// The section uses the real Google loader: replace it with the fake below.
const googleLoader = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("@/lib/google-maps", () => ({
  loadBusMapLibraries: googleLoader.load,
  onGoogleMapsAuthFailure: () => () => {},
}));

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
const campInput: CampLocationInput = {
  name: "Maplewood Day Camp and Enrichment Center",
  address: "150 Foundry St #106, South Easton, MA",
  location: { lat: 42.0075788, lng: -71.0734431 },
};
const { stops, camp } = buildBusMapModel(stopInputs, campInput);

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

  it("draws one green bus pin per stop, fits them all and never zooms on page scroll", async () => {
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
      expect([pin.width, pin.height]).toEqual([28, 35]);
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

  it("adds the camp as a larger yellow pin on top and fits it with the stops", async () => {
    const view = viewport();
    const { drawn, libraries } = fakeGoogle();
    render(
      <BusStopMap
        stops={stops}
        camp={camp}
        apiKey="key"
        mapId="map"
        services={services(async () => libraries).value}
      />,
    );
    view.near();
    await waitFor(() => expect(drawn.markers).toHaveLength(3));
    const campMarker = drawn.markers[2];
    expect(campMarker.options.title).toBe("Maplewood Day Camp and Enrichment Center");
    expect(campMarker.options.position).toEqual(camp?.position);
    const pin = campMarker.options.content as HTMLImageElement;
    expect(pin.getAttribute("src")).toBe(CAMP_PIN_SRC);
    expect(pin.width).toBeGreaterThan(28);
    for (const marker of drawn.markers.slice(0, 2))
      expect(campMarker.options.zIndex).toBeGreaterThan(marker.options.zIndex ?? Infinity);
    expect(drawn.fitted).toEqual([
      ...stops.map((stop) => stop.position),
      { lat: 42.0075788, lng: -71.0734431 },
    ]);
  });

  it("opens the camp popup with the name, the address and Get directions", async () => {
    const view = viewport();
    const { drawn, libraries } = fakeGoogle();
    render(
      <BusStopMap
        stops={stops}
        camp={camp}
        apiKey="key"
        mapId="map"
        services={services(async () => libraries).value}
      />,
    );
    view.near();
    await waitFor(() => expect(drawn.markers).toHaveLength(3));
    act(() => drawn.markers[2].clicks.forEach((click) => click()));
    const [popup] = drawn.popups;
    expect(popup.textContent).toContain("Maplewood Day Camp and Enrichment Center");
    expect(popup.textContent).toContain("150 Foundry St #106, South Easton, MA");
    const link = popup.querySelector("a");
    expect(link?.textContent).toBe("Get directions");
    expect(link?.getAttribute("href")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=42.0075788,-71.0734431",
    );
    expect(link?.getAttribute("target")).toBe("_blank");
  });

  it("draws no camp pin when the Camp location is empty", async () => {
    const view = viewport();
    const { drawn, libraries } = fakeGoogle();
    render(
      <BusStopMap
        stops={stops}
        camp={null}
        apiKey="key"
        mapId="map"
        services={services(async () => libraries).value}
      />,
    );
    view.near();
    await waitFor(() => expect(drawn.markers).toHaveLength(2));
    for (const marker of drawn.markers)
      expect((marker.options.content as HTMLElement).getAttribute("src")).toBe(BUS_STOP_PIN_SRC);
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
    props: {
      stops?: BusStopInput[];
      camp?: CampLocationInput | null;
      showStopList?: boolean | null;
      stopList?: { href: string | null } | null;
    } = {},
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
      camp: campInput,
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

  it("draws the camp from the Camp location next to the stops", async () => {
    const view = viewport();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "key");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID", "map");
    const { drawn, libraries } = fakeGoogle();
    googleLoader.load.mockResolvedValue(libraries);
    render(<BusMap {...section()} />);
    view.near();
    await waitFor(() => expect(drawn.markers).toHaveLength(3));
    expect(drawn.markers.map((marker) => marker.options.title)).toEqual([
      "Gilmore Hall",
      "Gavins Pond Soccer Fields",
      "Maplewood Day Camp and Enrichment Center",
    ]);
  });

  it("draws only the stops when Global Settings has no Camp location", async () => {
    const view = viewport();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "key");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID", "map");
    const { drawn, libraries } = fakeGoogle();
    googleLoader.load.mockResolvedValue(libraries);
    render(<BusMap {...section({ camp: null })} />);
    view.near();
    await waitFor(() => expect(drawn.markers).toHaveLength(2));
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

  it("links the message to the Bus page stop list on Home and Contact", async () => {
    viewport();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
    render(
      <BusMap
        {...section({
          stopList: { href: "/summer-camp/bus-transportation#bus-map" },
        })}
      />,
    );
    expect(await unavailable()).toBeVisible();
    expect(screen.getByRole("link", { name: STOP_LIST_LINK })).toHaveAttribute(
      "href",
      "/summer-camp/bus-transportation#bus-map",
    );
    expect(screen.queryByText(STOP_LIST_SUMMARY, { exact: false })).toBeNull();
  });

  it("shows the message without a link when no page shows the stop list", async () => {
    viewport();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
    render(<BusMap {...section({ stopList: null })} />);
    expect(await unavailable()).toBeVisible();
    expect(screen.queryByRole("link", { name: STOP_LIST_LINK })).toBeNull();
  });

  it("shows the stop list under the map only when its switch is on", async () => {
    viewport();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
    const { rerender } = render(<BusMap {...section()} />);
    expect(screen.queryByText(STOP_LIST_SUMMARY, { exact: false })).toBeNull();
    rerender(
      <BusMap
        {...section({
          showStopList: true,
          stopList: { href: "/summer-camp/bus-transportation#bus-map" },
        })}
      />,
    );
    expect(screen.getByText(STOP_LIST_SUMMARY, { exact: false })).toBeVisible();
    // The list is right under the map: the message does not link to it.
    expect(await unavailable()).toBeVisible();
    expect(screen.queryByRole("link", { name: STOP_LIST_LINK })).toBeNull();
  });
});

describe("BusStopList", () => {
  const inputs: BusStopInput[] = [
    ...stopInputs,
    {
      _id: "bus-stop-easton-library",
      name: "Ames Free Library",
      address: "53 Main St, Easton, MA 02356",
      town: "easton",
      location: { lat: 42.06, lng: -71.1 },
    },
    {
      _id: "bus-stop-easton-a",
      name: "Easton Middle School",
      address: "98 Columbus Ave, Easton, MA 02356",
      town: "Easton",
      location: { lat: 42.03, lng: -71.12 },
    },
    {
      _id: "bus-stop-hidden",
      name: "Hidden stop",
      address: "1 Hidden Rd",
      town: "Canton",
      location: { lat: 42.1, lng: -71.1 },
      shownOnMap: false,
    },
    {
      _id: "bus-stop-no-town",
      name: "Unnamed lot",
      address: "",
      town: "",
      location: { lat: 42.0, lng: -71.0 },
    },
  ];
  const { towns } = buildBusMapModel(inputs, campInput);

  it("is folded closed by default and counts the stops", () => {
    const { container } = render(<BusStopList towns={towns} />);
    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(details?.querySelector("summary")).toHaveTextContent(
      `${STOP_LIST_SUMMARY} (5)`,
    );
  });

  it("groups the stops by town A to Z, then by stop name, each with its address", () => {
    render(<BusStopList towns={towns} />);
    const headings = screen
      .getAllByRole("heading", { level: 3, hidden: true })
      .map((heading) => heading.textContent);
    expect(headings).toEqual([NO_TOWN, "easton", "Raynham", "Sharon"]);
    const easton = screen
      .getAllByRole("heading", { level: 3, hidden: true })[1]
      .closest("section") as HTMLElement;
    expect(
      within(easton)
        .getAllByRole("listitem", { hidden: true })
        .map((item) => item.textContent),
    ).toEqual([
      "Ames Free Library 53 Main St, Easton, MA 02356",
      "Easton Middle School 98 Columbus Ave, Easton, MA 02356",
    ]);
    expect(screen.queryByText("Hidden stop")).toBeNull();
  });

  it("is plain text for screen readers: no hidden text and no map-only content", () => {
    const { container } = render(<BusStopList towns={towns} />);
    expect(container.querySelector("[aria-hidden], [role=presentation]")).toBeNull();
    const items = screen.getAllByRole("listitem", { hidden: true });
    expect(items).toHaveLength(5);
    expect(items[items.length - 1]).toHaveTextContent(
      "Gavins Pond Soccer Fields 120 Gavins Pond Rd, Sharon, MA 02067",
    );
  });

  it("renders nothing when no stop is shown", () => {
    const { container } = render(<BusStopList towns={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
