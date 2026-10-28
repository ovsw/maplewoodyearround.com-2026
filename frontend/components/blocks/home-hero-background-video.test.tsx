import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomeHeroBackgroundVideo, {
  HOME_HERO_VIDEO_QUERY,
} from "./home-hero-background-video";

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

function mockReducedMotion(matches: boolean, { desktop = true } = {}) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      addEventListener: vi.fn(),
      matches: query === HOME_HERO_VIDEO_QUERY ? desktop : matches,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
    })),
  );
}

describe("HomeHeroBackgroundVideo", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does not mount an autoplay video when reduced motion is requested", () => {
    mockReducedMotion(true);
    const { container } = render(
      <HomeHeroBackgroundVideo poster="/poster.jpg" src="/hero.mp4" />,
    );

    expect(container.querySelector("video")).toBeNull();
  });

  it("autoplays the muted background video when motion is allowed", () => {
    mockReducedMotion(false);
    const { container } = render(
      <HomeHeroBackgroundVideo poster="/poster.jpg" src="/hero.mp4" />,
    );

    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveProperty("autoplay", true);
    expect(video).toHaveProperty("muted", true);
  });

  it("renders no video on a phone or small tablet viewport", () => {
    mockReducedMotion(false, { desktop: false });
    const { container } = render(
      <HomeHeroBackgroundVideo poster="/poster.jpg" src="/hero.mp4" />,
    );

    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("source")).toBeNull();
  });

  it("renders the video source on a desktop viewport", () => {
    mockReducedMotion(false, { desktop: true });
    const { container } = render(
      <HomeHeroBackgroundVideo poster="/poster.jpg" src="/hero.mp4" />,
    );

    expect(container.querySelector("video")).toHaveAttribute(
      "src",
      "/hero.mp4",
    );
  });
});

describe("HomeHeroBackgroundVideo with a Mux video", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("streams the Mux video instead of the video URL on desktop", async () => {
    mockReducedMotion(false, { desktop: true });
    const { container } = render(
      <HomeHeroBackgroundVideo
        playbackId={MUX_SAMPLE_ID}
        poster="/poster.jpg"
        src="/hero.mp4"
      />,
    );
    const video = await screen.findByTestId("mux-video");
    expect(video).toHaveAttribute("data-playback-id", MUX_SAMPLE_ID);
    expect(video).toHaveAttribute("data-autoplay", "true");
    expect(video).toHaveAttribute("poster", "/poster.jpg");
    expect(video).not.toHaveAttribute("src");
    expect(video).toHaveProperty("muted", true);
    expect(video).toHaveProperty("loop", true);
    expect(container.querySelectorAll("video")).toHaveLength(1);
  });

  it("uses the Mux still frame without a poster", async () => {
    mockReducedMotion(false, { desktop: true });
    render(<HomeHeroBackgroundVideo playbackId={MUX_SAMPLE_ID} />);
    expect(await screen.findByTestId("mux-video")).toHaveAttribute(
      "poster",
      `https://image.mux.com/${MUX_SAMPLE_ID}/thumbnail.webp`,
    );
  });

  it("renders nothing from Mux on a phone or small tablet viewport", () => {
    mockReducedMotion(false, { desktop: false });
    const { container } = render(
      <HomeHeroBackgroundVideo playbackId={MUX_SAMPLE_ID} src="/hero.mp4" />,
    );
    expect(container.querySelector("video")).toBeNull();
  });

  it("renders nothing from Mux when reduced motion is requested", () => {
    mockReducedMotion(true, { desktop: true });
    const { container } = render(
      <HomeHeroBackgroundVideo playbackId={MUX_SAMPLE_ID} />,
    );
    expect(container.querySelector("video")).toBeNull();
  });

  it("falls back to the video URL without a playback ID", () => {
    mockReducedMotion(false, { desktop: true });
    const { container } = render(
      <HomeHeroBackgroundVideo playbackId={null} src="/hero.mp4" />,
    );
    expect(screen.queryByTestId("mux-video")).toBeNull();
    expect(container.querySelector("video")).toHaveAttribute("src", "/hero.mp4");
  });
});
