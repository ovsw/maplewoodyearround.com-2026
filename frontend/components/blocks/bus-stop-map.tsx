"use client";

/*
 * The native Google bus map. It draws one green bus pin for each shown Bus
 * stop, plus a larger yellow "M" pin on top for the Camp location, and
 * fits them all on load. Google's script loads only when the map
 * comes near the viewport. Page scrolling never zooms the map: Google's
 * cooperative gestures need two fingers on touch and Ctrl+scroll on desktop.
 *
 * When there is no key or Map ID, no stop, the script fails, or Google
 * refuses the key, the map area shows "The map is not available right now."
 * On Home and Contact the message links to the stop list on the Bus page.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { BusMapPoint, BusStopPin, CampPin } from "@/lib/bus-map-model";
import {
  loadBusMapLibraries,
  onGoogleMapsAuthFailure,
  type BusMapLibraries,
} from "@/lib/google-maps";
import css from "./maplewood-home.module.css";

export const BUS_MAP_UNAVAILABLE = "The map is not available right now.";
export const STOP_LIST_LINK = "See the list of bus stops";
export const BUS_STOP_PIN_SRC = "/images/bus-map/bus-stop-pin.svg";
export const CAMP_PIN_SRC = "/images/bus-map/camp-pin.svg";
/** The stop pin: a green map pin with a white bus. Its tip marks the stop. */
const PIN_WIDTH = 28;
const PIN_HEIGHT = 35;
/** The camp pin: a larger yellow pin with a green border and a green "M". */
const CAMP_PIN_WIDTH = 48;
const CAMP_PIN_HEIGHT = 60;
const STOP_Z_INDEX = 1;
const CAMP_Z_INDEX = 2;
/** Room around the pins when the map fits them: the camp pin is taller. */
const CAMP_FIT_PADDING = 64;
const ONE_STOP_ZOOM = 14;
/** Start loading this far before the map scrolls into view. */
const LOAD_MARGIN = "400px 0px";

export type BusMapServices = {
  load: (key: string) => Promise<BusMapLibraries>;
  onAuthFailure: (listener: () => void) => () => void;
};

const googleServices: BusMapServices = {
  load: loadBusMapLibraries,
  onAuthFailure: onGoogleMapsAuthFailure,
};

type Props = {
  stops: BusStopPin[];
  /** The Camp location's pin; none when it is empty. */
  camp?: CampPin | null;
  apiKey?: string | null;
  mapId?: string | null;
  /** The stop list's address, linked from the "not available" message. */
  stopListHref?: string | null;
  /** Replaces Google in tests. */
  services?: BusMapServices;
};

export function BusMapUnavailable({ stopListHref }: { stopListHref?: string | null }) {
  return (
    <div className={css.mapUnavailable} role="status">
      <p>
        {BUS_MAP_UNAVAILABLE}
        {stopListHref ? (
          <>
            <br />
            <a href={stopListHref}>{STOP_LIST_LINK}</a>
          </>
        ) : null}
      </p>
    </div>
  );
}

type PopupText = { name: string; address: string; href: string; link: string };

function popup({ name, address, href, link }: PopupText): HTMLElement {
  const box = document.createElement("div");
  box.className = css.mapPopup;
  if (name) {
    const title = document.createElement("strong");
    title.textContent = name;
    box.append(title);
  }
  if (address) {
    const line = document.createElement("p");
    line.textContent = address;
    box.append(line);
  }
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.textContent = link;
  box.append(anchor);
  return box;
}

const stopPopup = (stop: BusStopPin) =>
  popup({ name: stop.name, address: stop.address, href: stop.googleMapsUrl, link: "View in Google Maps" });

const campPopup = (camp: CampPin) =>
  popup({ name: camp.name, address: camp.address, href: camp.directionsUrl, link: "Get directions" });

function pinImage(): HTMLImageElement {
  const image = document.createElement("img");
  image.src = BUS_STOP_PIN_SRC;
  image.width = PIN_WIDTH;
  image.height = PIN_HEIGHT;
  image.alt = "";
  image.draggable = false;
  return image;
}

function campPinElement(): HTMLImageElement {
  const image = document.createElement("img");
  image.className = css.campPin;
  image.src = CAMP_PIN_SRC;
  image.width = CAMP_PIN_WIDTH;
  image.height = CAMP_PIN_HEIGHT;
  image.alt = "";
  image.draggable = false;
  return image;
}

function drawMap(
  element: HTMLElement,
  libraries: BusMapLibraries,
  stops: BusStopPin[],
  camp: CampPin | null,
  mapId: string,
) {
  const { Map, InfoWindow, LatLngBounds, AdvancedMarkerElement } = libraries;
  const map = new Map(element, {
    mapId,
    gestureHandling: "cooperative",
    clickableIcons: false,
  });
  const info = new InfoWindow();
  const markers = stops.map((stop) => {
    const marker = new AdvancedMarkerElement({
      map,
      position: stop.position,
      content: pinImage(),
      title: stop.name,
      gmpClickable: true,
      // Without a zIndex Google puts lower pins in front of everything,
      // the camp too. A fixed order keeps the camp on top.
      zIndex: STOP_Z_INDEX,
    });
    marker.addEventListener("gmp-click", () => {
      info.setContent(stopPopup(stop));
      info.open({ map, anchor: marker });
    });
    return marker;
  });
  if (camp) {
    const marker = new AdvancedMarkerElement({
      map,
      position: camp.position,
      content: campPinElement(),
      title: camp.name || "Maplewood",
      gmpClickable: true,
      // The camp stays on top where it overlaps a nearby stop.
      zIndex: CAMP_Z_INDEX,
    });
    marker.addEventListener("gmp-click", () => {
      info.setContent(campPopup(camp));
      info.open({ map, anchor: marker });
    });
    markers.push(marker);
  }

  const points: BusMapPoint[] = stops.map((stop) => stop.position);
  if (camp) points.push(camp.position);
  if (points.length === 1) {
    map.setCenter(points[0]);
    map.setZoom(ONE_STOP_ZOOM);
  } else {
    const bounds = new LatLngBounds();
    for (const point of points) bounds.extend(point);
    map.fitBounds(bounds, camp ? CAMP_FIT_PADDING : PIN_HEIGHT);
  }

  return () => {
    info.close();
    for (const marker of markers) marker.map = null;
  };
}

export default function BusStopMap({
  stops,
  camp = null,
  apiKey,
  mapId,
  stopListHref,
  services = googleServices,
}: Props) {
  const element = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [failed, setFailed] = useState(false);
  const usable = Boolean(apiKey && mapId && stops.length);

  // Wait until the map area comes near the viewport.
  useEffect(() => {
    if (!usable || near) return;
    const target = element.current;
    if (!target || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: LOAD_MARGIN },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [usable, near]);

  // A server refresh (for example a live edit in Presentation) sends equal
  // data as new objects: keep the map unless the stops or the camp changed.
  const stopsSignature = JSON.stringify(stops);
  const campSignature = JSON.stringify(camp);
  const shownStops = useMemo<BusStopPin[]>(() => JSON.parse(stopsSignature), [stopsSignature]);
  const shownCamp = useMemo<CampPin | null>(() => JSON.parse(campSignature), [campSignature]);

  // Load Google's script and draw the stops.
  useEffect(() => {
    if (!usable || !near || failed || !apiKey || !mapId) return;
    const target = element.current;
    if (!target) return;
    let active = true;
    let clear = () => {};
    const fail = () => {
      if (active) setFailed(true);
    };
    const stopListening = services.onAuthFailure(fail);
    // Google replaces the map with its own error box when it refuses a
    // request after the script has loaded.
    const errors = new MutationObserver(() => {
      if (target.querySelector(".gm-err-container")) fail();
    });
    errors.observe(target, { childList: true, subtree: true });
    services
      .load(apiKey)
      .then((libraries) => {
        if (active) clear = drawMap(target, libraries, shownStops, shownCamp, mapId);
      })
      .catch(fail);
    return () => {
      active = false;
      stopListening();
      errors.disconnect();
      clear();
    };
  }, [usable, near, failed, apiKey, mapId, shownStops, shownCamp, services]);

  if (!usable || failed) return <BusMapUnavailable stopListHref={stopListHref} />;
  return (
    <div
      ref={element}
      className={css.map}
      role="region"
      aria-label="Map of the summer bus stops"
    />
  );
}
