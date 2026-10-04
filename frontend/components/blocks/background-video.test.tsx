import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BackgroundVideo from "./background-video";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function environment(reduced: boolean) {
  let intersect: (entries: { isIntersecting: boolean }[]) => void = () => {};
  let preferenceChanged = () => {};
  const preference = {
    matches: reduced,
    addEventListener: (_event: string, callback: () => void) => {
      preferenceChanged = callback;
    },
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", () => preference);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: typeof intersect) {
        intersect = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  const play = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockResolvedValue(undefined);
  const pause = vi
    .spyOn(HTMLMediaElement.prototype, "pause")
    .mockImplementation(() => {});
  return {
    play,
    pause,
    visible: (value: boolean) =>
      act(() => intersect([{ isIntersecting: value }])),
    reduce: () =>
      act(() => {
        preference.matches = true;
        preferenceChanged();
      }),
  };
}
describe("BackgroundVideo motion preferences", () => {
  it("allows a visitor to explicitly play and pause with reduced motion enabled", async () => {
    const env = environment(true);
    render(<BackgroundVideo mp4="/camp.mp4" poster="/poster.jpg" />);
    env.visible(true);
    expect(env.play).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Play background video" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Pause background video" }),
      ).toBeVisible(),
    );
    expect(env.play).toHaveBeenCalledTimes(1);
    fireEvent.click(
      screen.getByRole("button", { name: "Pause background video" }),
    );
    expect(env.pause).toHaveBeenCalled();
  });
  it("keeps the static poster when reduced motion is requested", () => {
    const env = environment(true);
    render(<BackgroundVideo mp4="/camp.mp4" poster="/poster.jpg" />);
    env.visible(true);
    expect(env.play).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Play background video" }),
    ).toBeVisible();
  });
  it("pauses offscreen, respects a visitor pause, and responds to reduced motion", async () => {
    const env = environment(false);
    render(<BackgroundVideo mp4="/camp.mp4" />);
    env.visible(true);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Pause background video" }),
      ).toBeVisible(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Pause background video" }),
    );
    env.visible(false);
    env.visible(true);
    expect(env.play).toHaveBeenCalledTimes(1);
    fireEvent.click(
      screen.getByRole("button", { name: "Play background video" }),
    );
    await waitFor(() => expect(env.play).toHaveBeenCalledTimes(2));
    env.reduce();
    expect(
      screen.getByRole("button", { name: "Play background video" }),
    ).toBeVisible();
    expect(env.pause).toHaveBeenCalled();
  });
});
