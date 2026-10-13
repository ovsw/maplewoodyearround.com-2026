"use client";

/*
 * The native Google bus map. It draws one green "M" pin for each shown Bus
 * stop and fits them all on load. Google's script loads only when the map
 * comes near the viewport. Page scrolling never zooms the map: Google's
 * cooperative gestures need two fingers on touch and Ctrl+scroll on desktop.
 *
 * When there is no key or Map ID, no stop, the script fails, or Google
 * refuses the key, the map area shows "The map is not available right now."
 */
import { useEffect, useRef, useState } from "react";
import type { BusStopPin } from "@/lib/bus-map-model";
import {
  loadBusMapLibraries,
  onGoogleMapsAuthFailure,
  type BusMapLibraries,
} from "@/lib/google-maps";
import css from "./maplewood-home.module.css";

export const BUS_MAP_UNAVAILABLE = "The map is not available right now.";
export const BUS_STOP_PIN_SRC = "/images/bus-map/bus-stop-pin.png";
const PIN_SIZE = 40;
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
  apiKey?: string | null;
  mapId?: string | null;
  /** Replaces Google in tests. */
  services?: BusMapServices;
};

export function BusMapUnavailable() {
  return (
    <div className={css.mapUnavailable} role="status">
      <p>{BUS_MAP_UNAVAILABLE}</p>
    </div>
  );
}

function popup(stop: BusStopPin): HTMLElement {
  const box = document.createElement("div");
  box.className = css.mapPopup;
  const name = document.createElement("strong");
  name.textContent = stop.name;
  box.append(name);
  if (stop.address) {
    const address = document.createElement("p");
    address.textContent = stop.address;
    box.append(address);
  }
  const link = document.createElement("a");
  link.href = stop.googleMapsUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "View in Google Maps";
  box.append(link);
  return box;
}

function pinImage(): HTMLImageElement {
  const image = document.createElement("img");
  image.src = BUS_STOP_PIN_SRC;
  image.width = PIN_SIZE;
  image.height = PIN_SIZE;
  image.alt = "";
  image.draggable = false;
  return image;
}

function drawMap(
  element: HTMLElement,
  libraries: BusMapLibraries,
  stops: BusStopPin[],
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
    });
    marker.addEventListener("gmp-click", () => {
      info.setContent(popup(stop));
      info.open({ map, anchor: marker });
    });
    return marker;
  });

  if (stops.length === 1) {
    map.setCenter(stops[0].position);
    map.setZoom(ONE_STOP_ZOOM);
  } else {
    const bounds = new LatLngBounds();
    for (const stop of stops) bounds.extend(stop.position);
    map.fitBounds(bounds, PIN_SIZE);
  }

  return () => {
    info.close();
    for (const marker of markers) marker.map = null;
  };
}

export default function BusStopMap({
  stops,
  apiKey,
  mapId,
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
        if (active) clear = drawMap(target, libraries, stops, mapId);
      })
      .catch(fail);
    return () => {
      active = false;
      stopListening();
      errors.disconnect();
      clear();
    };
  }, [usable, near, failed, apiKey, mapId, stops, services]);

  if (!usable || failed) return <BusMapUnavailable />;
  return (
    <div
      ref={element}
      className={css.map}
      role="region"
      aria-label="Map of the summer bus stops"
    />
  );
}
