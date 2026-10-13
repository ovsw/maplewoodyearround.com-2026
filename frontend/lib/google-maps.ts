/// <reference types="google.maps" />
/*
 * Loads the Google Maps JavaScript API once per page, with the public
 * website key, and reports a refused key.
 *
 * Google calls the global `gm_authFailure` when it refuses the key: a wrong
 * key, a site that is not on the key's allowed list, or a used-up daily
 * limit. Every map that listens then shows its "not available" message.
 */
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

export type BusMapLibraries = {
  Map: typeof google.maps.Map;
  InfoWindow: typeof google.maps.InfoWindow;
  LatLngBounds: typeof google.maps.LatLngBounds;
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
};

let configuredKey: string | null = null;

export async function loadBusMapLibraries(
  key: string,
): Promise<BusMapLibraries> {
  if (configuredKey === null) {
    setOptions({ key, v: "weekly" });
    configuredKey = key;
  }
  const [maps, core, marker] = await Promise.all([
    importLibrary("maps"),
    importLibrary("core"),
    importLibrary("marker"),
  ]);
  return {
    Map: maps.Map,
    InfoWindow: maps.InfoWindow,
    LatLngBounds: core.LatLngBounds,
    AdvancedMarkerElement: marker.AdvancedMarkerElement,
  };
}

type AuthFailureWindow = Window & { gm_authFailure?: () => void };
const authFailureListeners = new Set<() => void>();
let authFailed = false;
let handlerInstalled = false;

/**
 * Calls `listener` when Google refuses the key, at once if it already did.
 * Returns the function that stops listening.
 */
export function onGoogleMapsAuthFailure(listener: () => void): () => void {
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
