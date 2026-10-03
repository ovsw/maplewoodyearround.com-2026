import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  configurable: true,
  value: ResizeObserverStub,
});

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

// Defer rather than invoke inline: animation loops reschedule themselves every
// frame, and a synchronous callback recurses until the stack blows.
let rafHandle = 0;
const rafTimers = new Map<number, ReturnType<typeof setTimeout>>();

window.requestAnimationFrame = (callback) => {
  const handle = ++rafHandle;
  rafTimers.set(
    handle,
    setTimeout(() => {
      rafTimers.delete(handle);
      callback(performance.now());
    }, 0),
  );
  return handle;
};

window.cancelAnimationFrame = (handle) => {
  const timer = rafTimers.get(handle);
  if (timer) clearTimeout(timer);
  rafTimers.delete(handle);
};
