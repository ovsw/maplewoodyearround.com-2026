/// <reference types="google.maps" />
/*
 * The combined location input of a Bus stop and of the Camp location:
 * the address field with Google Places suggestions, and under it a zoomable
 * map with a draggable pin. The rules for when the pin moves are in
 * ./address-pin.ts.
 *
 * Three parts work together:
 * - `AddressPinScope` is the input of the whole Bus stop document or Camp
 *   location object. It owns the address-to-pin rule, because only it can
 *   change both the address and the pin fields.
 * - `AddressSearchInput` is the address field: the normal text field, the
 *   suggestions, the map and the "Move pin to this address" button.
 * - `PinInput` is the pin field: its coordinates and "Remove pin".
 */
import { Box, Button, Card, Flex, Spinner, Stack, Text } from "@sanity/ui";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  set,
  setIfMissing,
  unset,
  type FormPatch,
  type ObjectInputProps,
  type ObjectSchemaType,
  type StringInputProps,
} from "sanity";
import {
  applyAddressPinEvent,
  offersMovePin,
  roundPoint,
  samePoint,
  storedChanges,
  toPinPoint,
  type AddressPinEvent,
  type AddressPinState,
  type PinPoint,
} from "./address-pin";
import {
  ADDRESS_PIN_MESSAGES,
  addressPinStatusMessage,
  initialGoogleMapsStatus,
  type GoogleMapsStatus,
} from "./address-pin-messages";
import {
  loadStudioMapLibraries,
  onStudioMapsAuthFailure,
  studioGoogleMapsKey,
  studioGoogleMapsMapId,
  type StudioMapLibraries,
} from "./google-maps";

/** The camp in South Easton: the map's first view when there is no pin. */
const CAMP_CENTER: PinPoint = { lat: 42.0075788, lng: -71.0734431 };
const AREA_ZOOM = 11;
const STREET_ZOOM = 17;
/** Suggestions favour places within about 50 km of the camp. */
const SEARCH_RADIUS_M = 50_000;
const MIN_SEARCH_LENGTH = 3;
/** Wait for a pause in typing: every request counts against Google's daily limit. */
const SEARCH_DELAY_MS = 350;

type AddressPinScopeValue = {
  state: AddressPinState;
  dispatch: (event: AddressPinEvent) => void;
};

const AddressPinContext = createContext<AddressPinScopeValue | null>(null);

type LocationValue = { address?: unknown; location?: unknown } | undefined;

/** The input of the whole Bus stop document or Camp location object. */
export function AddressPinScope(props: ObjectInputProps) {
  const { onChange, schemaType } = props;
  const value = props.value as LocationValue;
  // The waiting position remembers the pin it was offered against. When the
  // stored pin changes from outside this input (another editor, a discarded
  // draft, a restored revision), the offer no longer applies.
  const [pending, setPending] = useState<{ point: PinPoint; pin: PinPoint | null } | null>(null);
  const state = useMemo<AddressPinState>(() => {
    const pin = toPinPoint(value?.location);
    return {
      address: typeof value?.address === "string" ? value.address : "",
      pin,
      pending: pending && samePoint(pending.pin, pin) ? pending.point : null,
    };
  }, [value?.address, value?.location, pending]);
  const current = useRef(state);
  current.current = state;
  const hasValue = value !== undefined;

  const dispatch = useCallback(
    (event: AddressPinEvent) => {
      const before = current.current;
      const after = applyAddressPinEvent(before, event);
      const changes = storedChanges(before, after);
      const patches: FormPatch[] = [];
      if (changes.address !== undefined) {
        patches.push(changes.address ? set(changes.address, ["address"]) : unset(["address"]));
      }
      if (changes.pin !== undefined) {
        patches.push(
          changes.pin
            ? set({ _type: "geopoint", lat: changes.pin.lat, lng: changes.pin.lng }, ["location"])
            : unset(["location"]),
        );
      }
      if (patches.length) {
        onChange(hasValue ? patches : [setIfMissing({ _type: (schemaType as ObjectSchemaType).name }), ...patches]);
      }
      current.current = after;
      setPending(after.pending ? { point: after.pending, pin: after.pin } : null);
    },
    [onChange, schemaType, hasValue],
  );

  const scope = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return <AddressPinContext.Provider value={scope}>{props.renderDefault(props)}</AddressPinContext.Provider>;
}

/** Loads Google once and follows a refused key. */
function useGoogleMaps(): { status: GoogleMapsStatus; libraries: StudioMapLibraries | null } {
  const [status, setStatus] = useState<GoogleMapsStatus>(() => initialGoogleMapsStatus(studioGoogleMapsKey));
  const [libraries, setLibraries] = useState<StudioMapLibraries | null>(null);

  useEffect(() => {
    if (!studioGoogleMapsKey) return undefined;
    let active = true;
    const stop = onStudioMapsAuthFailure(() => {
      if (active) setStatus("refused");
    });
    loadStudioMapLibraries(studioGoogleMapsKey).then(
      (loaded) => {
        if (!active) return;
        setLibraries(loaded);
        setStatus((previous) => (previous === "refused" ? previous : "ready"));
      },
      () => {
        if (active) setStatus((previous) => (previous === "refused" ? previous : "failed"));
      },
    );
    return () => {
      active = false;
      stop();
    };
  }, []);

  return { status, libraries };
}

type Suggestion = { key: string; text: string; prediction: google.maps.places.PlacePrediction };

function readPoint(position: google.maps.marker.AdvancedMarkerElement["position"]): PinPoint | null {
  if (!position) return null;
  const lat = typeof position.lat === "function" ? position.lat() : position.lat;
  const lng = typeof position.lng === "function" ? position.lng() : position.lng;
  return toPinPoint({ lat, lng });
}

/** The address field: text, Google suggestions, map with pin, and the move button. */
export function AddressSearchInput(props: StringInputProps) {
  const scope = useContext(AddressPinContext);
  const { status, libraries } = useGoogleMaps();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const session = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const query = useRef(0);

  const search = useCallback(
    (text: string) => {
      if (timer.current) clearTimeout(timer.current);
      const input = text.trim();
      if (!libraries || status !== "ready" || input.length < MIN_SEARCH_LENGTH) {
        setSuggestions([]);
        setSearchNote(null);
        return;
      }
      timer.current = setTimeout(() => {
        const id = ++query.current;
        session.current ??= new libraries.AutocompleteSessionToken();
        libraries.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: session.current,
          includedRegionCodes: ["us"],
          locationBias: { center: CAMP_CENTER, radius: SEARCH_RADIUS_M },
        }).then(
          ({ suggestions: found }) => {
            if (id !== query.current) return;
            const list = found.flatMap((suggestion, index) => {
              const prediction = suggestion.placePrediction;
              return prediction ? [{ key: `${prediction.placeId}-${index}`, text: prediction.text.text, prediction }] : [];
            });
            setSuggestions(list);
            setSearchNote(list.length ? null : ADDRESS_PIN_MESSAGES.noSuggestions);
          },
          () => {
            if (id !== query.current) return;
            setSuggestions([]);
            setSearchNote(ADDRESS_PIN_MESSAGES.searchRefused);
          },
        );
      }, SEARCH_DELAY_MS);
    },
    [libraries, status],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const pick = useCallback(
    async (suggestion: Suggestion) => {
      if (!scope) return;
      query.current++;
      setSuggestions([]);
      setPicking(true);
      try {
        const place = suggestion.prediction.toPlace();
        await place.fetchFields({ fields: ["location"] });
        const point = place.location ? toPinPoint({ lat: place.location.lat(), lng: place.location.lng() }) : null;
        if (point) {
          scope.dispatch({ type: "pickAddress", address: suggestion.text, point });
          setSearchNote(null);
        } else {
          setSearchNote(ADDRESS_PIN_MESSAGES.noSuggestions);
        }
      } catch {
        setSearchNote(ADDRESS_PIN_MESSAGES.searchRefused);
      } finally {
        // The session ends with the place lookup; the next search starts a new one.
        session.current = null;
        setPicking(false);
      }
    },
    [scope],
  );

  const { elementProps } = props;
  const onTextChange = elementProps.onChange;
  const withSearch = useMemo(
    () => ({
      ...props,
      elementProps: {
        ...elementProps,
        onChange: (event: ChangeEvent<HTMLInputElement>) => {
          onTextChange(event);
          search(event.currentTarget.value);
        },
      },
    }),
    [props, elementProps, onTextChange, search],
  );

  if (!scope) return props.renderDefault(props);
  const message = addressPinStatusMessage(status);

  return (
    <Stack space={3}>
      {props.renderDefault(withSearch)}
      {suggestions.length > 0 && !props.readOnly ? (
        <Card border radius={2} shadow={1} padding={1}>
          <Stack space={1} role="listbox" aria-label="Google address suggestions">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion.key}
                mode="bleed"
                justify="flex-start"
                role="option"
                text={suggestion.text}
                onClick={() => void pick(suggestion)}
              />
            ))}
          </Stack>
        </Card>
      ) : null}
      {picking ? (
        <Flex align="center" gap={2}>
          <Spinner muted />
          <Text muted size={1}>
            Finding the address on the map…
          </Text>
        </Flex>
      ) : null}
      {searchNote ? (
        <Card padding={3} radius={2} tone="caution" border>
          <Text size={1}>{searchNote}</Text>
        </Card>
      ) : null}
      {message ? (
        <Card padding={3} radius={2} tone={status === "missing-key" ? "caution" : "critical"} border>
          <Text size={1}>{message}</Text>
        </Card>
      ) : (
        <PinMap
          libraries={libraries}
          state={scope.state}
          readOnly={Boolean(props.readOnly)}
          onDrag={(point) => scope.dispatch({ type: "dragPin", point })}
        />
      )}
      {offersMovePin(scope.state) && !props.readOnly ? (
        <Card padding={3} radius={2} tone="primary" border>
          <Stack space={3}>
            <Text size={1}>
              The pin stays where it is. The grey pin shows the address you picked.
            </Text>
            <Box>
              <Button
                tone="primary"
                text="Move pin to this address"
                onClick={() => scope.dispatch({ type: "movePinToAddress" })}
              />
            </Box>
          </Stack>
        </Card>
      ) : null}
    </Stack>
  );
}

type PinMapProps = {
  libraries: StudioMapLibraries | null;
  state: AddressPinState;
  readOnly: boolean;
  onDrag: (point: PinPoint) => void;
};

/** The zoomable map with the draggable pin and, while offered, the grey pin. */
function PinMap({ libraries, state, readOnly, onDrag }: PinMapProps) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const pendingMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  /** The last position the editor dragged to: the map does not jump there. */
  const dragged = useRef<PinPoint | null>(null);
  const handlers = useRef({ onDrag, readOnly, hasPin: Boolean(state.pin) });
  handlers.current = { onDrag, readOnly, hasPin: Boolean(state.pin) };

  useEffect(() => {
    if (!libraries || !element.current || map.current) return;
    const { Map, AdvancedMarkerElement, PinElement } = libraries;
    const start = state.pin;
    const created = new Map(element.current, {
      mapId: studioGoogleMapsMapId,
      center: start ?? CAMP_CENTER,
      zoom: start ? STREET_ZOOM : AREA_ZOOM,
      gestureHandling: "cooperative",
      clickableIcons: false,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: true,
    });
    const pin = new AdvancedMarkerElement({ title: "Pin" });
    const report = () => {
      const point = readPoint(pin.position);
      if (!point) return;
      dragged.current = roundPoint(point);
      handlers.current.onDrag(point);
    };
    pin.addListener("dragend", report);
    // Clicking the map places a missing pin, for a corner Google cannot find.
    created.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (handlers.current.readOnly || handlers.current.hasPin || !event.latLng) return;
      const point = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      dragged.current = roundPoint(point);
      handlers.current.onDrag(point);
    });
    const grey = new PinElement({ background: "#9e9e9e", borderColor: "#616161", glyphColor: "#ffffff" });
    pendingMarker.current = new AdvancedMarkerElement({ content: grey, title: "The address you picked" });
    marker.current = pin;
    map.current = created;
    // The map is created once; the effects below follow later pin changes.
  }, [libraries]);

  const lat = state.pin?.lat;
  const lng = state.pin?.lng;
  useEffect(() => {
    const pin = marker.current;
    const view = map.current;
    if (!pin || !view) return;
    pin.gmpDraggable = !readOnly;
    if (lat === undefined || lng === undefined) {
      pin.map = null;
      return;
    }
    const point = { lat, lng };
    pin.position = point;
    pin.map = view;
    const byDrag = dragged.current && dragged.current.lat === lat && dragged.current.lng === lng;
    dragged.current = null;
    if (byDrag) return;
    view.panTo(point);
    if ((view.getZoom() ?? 0) < STREET_ZOOM - 2) view.setZoom(STREET_ZOOM);
  }, [lat, lng, readOnly, libraries]);

  const pendingLat = state.pending?.lat;
  const pendingLng = state.pending?.lng;
  useEffect(() => {
    const grey = pendingMarker.current;
    const view = map.current;
    if (!grey || !view || !libraries) return;
    if (pendingLat === undefined || pendingLng === undefined) {
      grey.map = null;
      return;
    }
    const point = { lat: pendingLat, lng: pendingLng };
    grey.position = point;
    grey.map = view;
    if (lat !== undefined && lng !== undefined) {
      const bounds = new libraries.LatLngBounds();
      bounds.extend(point);
      bounds.extend({ lat, lng });
      view.fitBounds(bounds, 48);
    } else {
      view.panTo(point);
    }
  }, [pendingLat, pendingLng, lat, lng, libraries]);

  return (
    <Stack space={2}>
      <Card border radius={2} overflow="hidden" style={{ position: "relative" }}>
        <div ref={element} style={{ height: 360, width: "100%" }} aria-label="Map with the pin" />
        {!libraries ? (
          <Flex align="center" justify="center" style={{ position: "absolute", inset: 0 }}>
            <Spinner muted />
          </Flex>
        ) : null}
      </Card>
      <Text muted size={1}>
        {readOnly
          ? "The map shows the pin."
          : state.pin
            ? "Zoom in and drag the pin to the exact corner or side of the street. Dragging never changes the address text."
            : "Pick an address above to place the pin, or click the map. If Google cannot find a corner, pick the town and drag the pin."}
      </Text>
    </Stack>
  );
}

/** The pin field: its coordinates and "Remove pin". The map is above. */
export function PinInput(props: ObjectInputProps) {
  const scope = useContext(AddressPinContext);
  const pin = toPinPoint(props.value);
  if (!scope) return props.renderDefault(props);

  return (
    <Flex align="center" gap={3} wrap="wrap">
      <Box flex={1}>
        <Text size={1} muted={!pin}>
          {pin
            ? `Latitude ${pin.lat}, longitude ${pin.lng}`
            : "No pin yet, so this place stays off the website map. Pick an address or click the map above."}
        </Text>
      </Box>
      {pin && !props.readOnly ? (
        <Button
          mode="ghost"
          tone="critical"
          fontSize={1}
          text="Remove pin"
          onClick={() => scope.dispatch({ type: "removePin" })}
        />
      ) : null}
    </Flex>
  );
}
