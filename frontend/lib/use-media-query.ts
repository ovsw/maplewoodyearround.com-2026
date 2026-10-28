"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a CSS media query and updates when it changes, for example when a
 * tablet rotates. The server and the first hydration render use
 * `serverValue`, so pick the value that is safe before the browser answers.
 */
export function useMediaQuery(query: string, serverValue: boolean) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", onStoreChange);
      return () => mediaQuery.removeEventListener("change", onStoreChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
