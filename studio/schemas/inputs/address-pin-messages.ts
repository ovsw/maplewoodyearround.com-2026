/*
 * What the location input tells the editor when Google is not available.
 * In every case the address text can still be typed and saved.
 */

export type GoogleMapsStatus =
  | "loading"
  | "ready"
  /** The Studio has no Google Maps key. */
  | "missing-key"
  /** Google refused the key: wrong key, host not allowed, or daily limit. */
  | "refused"
  /** The Google script did not load, for example without internet. */
  | "failed";

export const ADDRESS_PIN_MESSAGES = {
  "missing-key":
    "The map and the address search are off: this Studio has no Google Maps key. You can still type the address. Ask your developer to add the Studio's Google Maps key.",
  refused:
    "Google refused this Studio's Maps key, so the map and the address search are off. The daily limit may be used up: try again tomorrow. If it continues, ask your developer to check the Studio's Google Maps key. You can still type the address.",
  failed:
    "The map could not load. Check the internet connection and reload the page. You can still type the address.",
  searchRefused:
    "Google refused the address search. You can still type the address, and drag the pin or click the map to place it.",
  noSuggestions: "Google found no address for this text. Try the town, then drag the pin.",
} as const;

/** The message for a status, or null when the input works. */
export function addressPinStatusMessage(status: GoogleMapsStatus): string | null {
  if (status === "missing-key" || status === "refused" || status === "failed") {
    return ADDRESS_PIN_MESSAGES[status];
  }
  return null;
}

/** The status before Google is asked for anything. */
export function initialGoogleMapsStatus(key: string | null | undefined): GoogleMapsStatus {
  return key?.trim() ? "loading" : "missing-key";
}

