import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomeHeroBackgroundVideo, {
  HOME_HERO_VIDEO_QUERY,
} from "./home-hero-background-video";

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
