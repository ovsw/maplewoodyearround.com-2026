/*
 * The address-to-pin rule for the Bus stop and Camp location input.
 *
 * - Picking an address when there is no pin places the pin there.
 * - Picking an address when there is a pin keeps the pin and offers
 *   "Move pin to this address". Only that button moves the pin.
 * - Dragging the pin (or placing it by hand) never changes the address text.
 * - Typing in the address field changes only the text.
 *
 * A picked suggestion fills the address text; the editor can edit it after.
 * The rule is pure so that `node --test` covers it without a browser.
 */

export type PinPoint = { lat: number; lng: number };

export type AddressPinState = {
  /** The address text, stored exactly as the editor leaves it. */
  address: string;
  /** The stored pin, or null when the stop has no pin yet. */
  pin: PinPoint | null;
  /** A picked address's position that waits for "Move pin to this address". */
  pending: PinPoint | null;
};

export type AddressPinEvent =
  /** The editor picked a Google suggestion. */
  | { type: "pickAddress"; address: string; point: PinPoint }
  /** The editor typed in the address field. */
  | { type: "editAddress"; address: string }
  /** The editor pressed "Move pin to this address". */
  | { type: "movePinToAddress" }
  /** The editor dragged the pin, or clicked the map to place it. */
  | { type: "dragPin"; point: PinPoint }
  /** The editor removed the pin. */
  | { type: "removePin" };

/** Seven decimals is about 1 cm: more than enough for a street corner. */
const DECIMALS = 1e7;

export function roundPoint(point: PinPoint): PinPoint {
  return {
    lat: Math.round(point.lat * DECIMALS) / DECIMALS,
    lng: Math.round(point.lng * DECIMALS) / DECIMALS,
  };
}

/** A usable pin from a stored geopoint, or null. */
export function toPinPoint(value: unknown): PinPoint | null {
  if (!value || typeof value !== "object") return null;
  const { lat, lng } = value as { lat?: unknown; lng?: unknown };
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function samePoint(a: PinPoint | null, b: PinPoint | null): boolean {
  if (!a || !b) return a === b;
  const left = roundPoint(a);
  const right = roundPoint(b);
  return left.lat === right.lat && left.lng === right.lng;
}

export function applyAddressPinEvent(
  state: AddressPinState,
  event: AddressPinEvent,
): AddressPinState {
  switch (event.type) {
    case "pickAddress": {
      const point = roundPoint(event.point);
      if (!state.pin) return { address: event.address, pin: point, pending: null };
      return {
        address: event.address,
        pin: state.pin,
        pending: samePoint(state.pin, point) ? null : point,
      };
    }
    case "editAddress":
      return { ...state, address: event.address };
    case "movePinToAddress":
      return state.pending ? { ...state, pin: state.pending, pending: null } : state;
    case "dragPin":
      return { ...state, pin: roundPoint(event.point) };
    case "removePin":
      return { ...state, pin: null, pending: null };
  }
}

/** True when the input shows "Move pin to this address". */
export function offersMovePin(state: AddressPinState): boolean {
  return state.pending !== null;
}

export type AddressPinChanges = {
  /** The new address text; an empty string means "clear the field". */
  address?: string;
  /** The new pin; null means "remove the pin". */
  pin?: PinPoint | null;
};

/** The stored fields that differ between two states, to turn into patches. */
export function storedChanges(
  before: AddressPinState,
  after: AddressPinState,
): AddressPinChanges {
  const changes: AddressPinChanges = {};
  if (before.address !== after.address) changes.address = after.address;
  if (!samePoint(before.pin, after.pin)) changes.pin = after.pin;
  return changes;
}
