import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BackgroundVideo, { BACKGROUND_VIDEO_QUERY } from "./background-video";

// The real Mux element attaches its stream with hls.js, which jsdom cannot
// run. This stand-in records the props the component passes to it.
vi.mock("@mux/mux-video-react", async () => {
  const { createElement, forwardRef } =
    await vi.importActual<typeof import("react")>("react");
  return {
    default: forwardRef<HTMLVideoElement, Record<string, unknown>>(
      function MuxVideo(
        { playbackId, streamType, disableTracking, autoPlay, ...props },
        ref,
      ) {
        return createElement("video", {
          ...props,
          ref,
          "data-testid": "mux-video",
          "data-playback-id": playbackId,
          "data-stream-type": streamType,
          "data-tracking": disableTracking ? "off" : "on",
          "data-autoplay": autoPlay ? "true" : undefined,
        });
      },
    ),
  };
});

/** Mux's public sample video, used only in tests. */
const MUX_SAMPLE_ID = "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function environment(reduced: boolean, { desktop = true } = {}) {
  let intersect: (entries: { isIntersecting: boolean }[]) => void = () => {};
  let preferenceChanged = () => {};
  const preference = {
    matches: reduced,
    addEventListener: (_event: string, callback: () => void) => {
      preferenceChanged = callback;
    },
    removeEventListener: vi.fn(),
  };
  const viewport = {
    matches: desktop,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", (query: string) =>
    query === BACKGROUND_VIDEO_QUERY ? viewport : preference,
  );
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
  it("waits for the page to finish loading before it starts", async () => {
    const env = environment(false);
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    render(<BackgroundVideo mp4="/camp.mp4" />);
    env.visible(true);
    expect(env.play).not.toHaveBeenCalled();
    act(() => {
      window.dispatchEvent(new Event("load"));
    });
    await waitFor(() => expect(env.play).toHaveBeenCalledTimes(1));
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

describe("BackgroundVideo viewport", () => {
  it("renders no sources and no control on a small viewport", () => {
    const env = environment(false, { desktop: false });
    const { container } = render(
      <BackgroundVideo mp4="/camp.mp4" webm="/camp.webm" poster="/poster.jpg" />,
    );
    env.visible(true);
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("poster", "/poster.jpg");
    expect(video).not.toHaveAttribute("src");
    expect(container.querySelector("source")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(env.play).not.toHaveBeenCalled();
  });

  it("renders the sources and the control on a large viewport", async () => {
    const env = environment(false, { desktop: true });
    const { container } = render(
      <BackgroundVideo mp4="/camp.mp4" webm="/camp.webm" poster="/poster.jpg" />,
    );
    const sources = [...container.querySelectorAll("source")].map((source) =>
      source.getAttribute("src"),
    );
    expect(sources).toEqual(["/camp.webm", "/camp.mp4"]);
    env.visible(true);
    await waitFor(() => expect(env.play).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole("button", { name: "Pause background video" }),
    ).toBeVisible();
  });
});

describe("BackgroundVideo with a Mux video", () => {
  it("streams the Mux video instead of the files on a large viewport", async () => {
    const env = environment(false, { desktop: true });
    const { container } = render(
      <BackgroundVideo
        muxPlaybackId={MUX_SAMPLE_ID}
        mp4="/camp.mp4"
        webm="/camp.webm"
        poster="/poster.jpg"
      />,
    );
    const video = await screen.findByTestId("mux-video");
    expect(video).toHaveAttribute("data-playback-id", MUX_SAMPLE_ID);
    expect(video).toHaveAttribute("data-stream-type", "on-demand");
    expect(video).toHaveAttribute("poster", "/poster.jpg");
    expect(video).toHaveAttribute("preload", "none");
    expect(video).toHaveProperty("muted", true);
    expect(video).toHaveProperty("loop", true);
    expect(container.querySelectorAll("video")).toHaveLength(1);
    expect(container.querySelector("source")).toBeNull();
    env.visible(true);
    await waitFor(() => expect(env.play).toHaveBeenCalledTimes(1));
    fireEvent.click(
      await screen.findByRole("button", { name: "Pause background video" }),
    );
    expect(env.pause).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Play background video" }),
    ).toBeVisible();
  });

  it("uses the Mux still frame when the block has no poster", async () => {
    environment(false, { desktop: true });
    render(<BackgroundVideo muxPlaybackId={MUX_SAMPLE_ID} />);
    expect(await screen.findByTestId("mux-video")).toHaveAttribute(
      "poster",
      `https://image.mux.com/${MUX_SAMPLE_ID}/thumbnail.webp`,
    );
  });

  it("keeps reduced motion: the Mux video waits for the visitor", async () => {
    const env = environment(true, { desktop: true });
    render(<BackgroundVideo muxPlaybackId={MUX_SAMPLE_ID} poster="/p.jpg" />);
    await screen.findByTestId("mux-video");
    env.visible(true);
    expect(env.play).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Play background video" }),
    ).toBeVisible();
  });

  it("makes no Mux request on a small viewport", () => {
    const env = environment(false, { desktop: false });
    const { container } = render(
      <BackgroundVideo muxPlaybackId={MUX_SAMPLE_ID} poster="/poster.jpg" />,
    );
    env.visible(true);
    expect(screen.queryByTestId("mux-video")).toBeNull();
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("poster", "/poster.jpg");
    expect(video).not.toHaveAttribute("src");
    expect(container.innerHTML).not.toContain("mux.com");
    expect(screen.queryByRole("button")).toBeNull();
    expect(env.play).not.toHaveBeenCalled();
  });

  it("falls back to the video files without a playback ID", () => {
    environment(false, { desktop: true });
    const { container } = render(
      <BackgroundVideo muxPlaybackId={null} mp4="/camp.mp4" poster="/poster.jpg" />,
    );
    expect(screen.queryByTestId("mux-video")).toBeNull();
    expect(container.querySelector("source")).toHaveAttribute("src", "/camp.mp4");
  });
});
