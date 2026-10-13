/// <reference types="google.maps" />
/*
 * Loads the Google Maps JavaScript API in the Studio with the Studio key
 * (map, Places and Geocoding; allowed on maplewood.sanity.studio and
 * localhost:3333). The website uses its own, map-only key.
 *
 * Google calls the global `gm_authFailure` when it refuses the key: a wrong
 * key, a host that is not on the key's allowed list, or a used-up daily
 * limit. The location input then shows a clear message.
 */
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

/** Read at build time from studio/.env.local; never committed. */
export const studioGoogleMapsKey = process.env.SANITY_STUDIO_GOOGLE_MAPS_API_KEY?.trim() || "";

/**
 * Advanced markers need a Map ID. Google's demo ID works when the project's
 * own Map ID is not set.
 */
export const studioGoogleMapsMapId =
  process.env.SANITY_STUDIO_GOOGLE_MAPS_MAP_ID?.trim() || "DEMO_MAP_ID";

export type StudioMapLibraries = {
  Map: typeof google.maps.Map;
  LatLngBounds: typeof google.maps.LatLngBounds;
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
  PinElement: typeof google.maps.marker.PinElement;
  AutocompleteSuggestion: typeof google.maps.places.AutocompleteSuggestion;
  AutocompleteSessionToken: typeof google.maps.places.AutocompleteSessionToken;
};

let configured = false;
let loading: Promise<StudioMapLibraries> | null = null;

export function loadStudioMapLibraries(key: string): Promise<StudioMapLibraries> {
  if (!configured) {
    setOptions({ key, v: "weekly" });
    configured = true;
  }
  loading ??= Promise.all([
    importLibrary("maps"),
    importLibrary("core"),
    importLibrary("marker"),
    importLibrary("places"),
  ]).then(([maps, core, marker, places]) => ({
    Map: maps.Map,
    LatLngBounds: core.LatLngBounds,
    AdvancedMarkerElement: marker.AdvancedMarkerElement,
    PinElement: marker.PinElement,
    AutocompleteSuggestion: places.AutocompleteSuggestion,
    AutocompleteSessionToken: places.AutocompleteSessionToken,
  }));
  // A failed load may be a passing network problem: let a later input retry.
  loading.catch(() => {
    loading = null;
  });
  return loading;
}

type AuthFailureWindow = Window & { gm_authFailure?: () => void };
const authFailureListeners = new Set<() => void>();
let authFailed = false;
let handlerInstalled = false;

/** Calls `listener` when Google refuses the key, at once if it already did. */
export function onStudioMapsAuthFailure(listener: () => void): () => void {
  if (authFailed) {
    listener();
    return () => {};
  }
  const target = window as AuthFailureWindow;
  if (!handlerInstalled) {
    handlerInstalled = true;
    const previous = target.gm_authFailure;
    target.gm_authFailure = () => {
      authFailed = true;
      previous?.();
      for (const notify of [...authFailureListeners]) notify();
    };
  }
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}
