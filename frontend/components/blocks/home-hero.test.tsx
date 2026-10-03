import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import HomeHero, { resolveHomeHeroButtonVariant } from "./home-hero";
import { getHomeHeroVideoEmbedUrl } from "./home-hero-video";

const loneVideoButtonHero: ComponentProps<typeof HomeHero> = {
  _key: "hero-test",
  _type: "homeHero",
  background: null,
  body: null,
  buttons: null,
  filmButton: {
    label: "View Film",
    url: "https://www.youtube.com/watch?v=bSF5jKJhTvA",
  },
  image: null,
  shortBody: null,
  stats: null,
  title: [
    {
      _key: "title",
      _type: "block",
      children: [
        { _key: "title-text", _type: "span", marks: [], text: "Camp" },
      ],
      markDefs: null,
      style: "normal",
    },
  ],
  videoUrl: null,
  disableVideo: null,
};

describe("resolveHomeHeroButtonVariant", () => {
  it("keeps the style selected in Sanity", () => {
    expect(resolveHomeHeroButtonVariant("outline", 0)).toBe("outline");
    expect(resolveHomeHeroButtonVariant("ghost", 1)).toBe("ghost");
  });

  it("keeps a lone button visible when its style is missing", () => {
    expect(resolveHomeHeroButtonVariant(undefined, 0)).toBe("outline");
  });

  it("uses ghost as the second-button fallback", () => {
    expect(resolveHomeHeroButtonVariant(undefined, 1)).toBe("ghost");
  });

  it("recognizes a video button without depending on its array position", () => {
    expect(
      getHomeHeroVideoEmbedUrl("https://www.youtube.com/watch?v=bSF5jKJhTvA"),
    ).toBe(
      "https://www.youtube-nocookie.com/embed/bSF5jKJhTvA?autoplay=1&rel=0",
    );
  });

  it("renders the film button on the poster (phones) and in the CTA row (desktop)", () => {
    render(<HomeHero {...loneVideoButtonHero} />);

    const buttons = screen.getAllByRole("button", { name: "View Film" });
    expect(buttons).toHaveLength(2);

    // Poster copy: glass ghost pill, hidden on desktop.
    const poster = buttons[0]!;
    expect(poster.className).toContain("bg-fill-night/55");
    expect(poster.parentElement?.className).toContain("lg:hidden");

    // CTA-row copy: ghost pill with the play icon, hidden on phones.
    const button = buttons[1]!;
    expect(button.closest("div.hidden")?.className).toContain("lg:flex");
    expect(button.className).not.toContain("shadow-teal-action");
    expect(button.className).toContain("hover:shadow-none");
    expect(button.querySelector("svg")).not.toBeNull();
  });

  it("renders the fallback label for an ordinary link without button text", () => {
    render(
      <HomeHero
        {...loneVideoButtonHero}
        buttons={[
          {
            _key: "apply",
            _type: "button",
            href: "/apply",
            icon: null,
            openInNewTab: false,
            text: null,
            variant: "outline",
          },
        ]}
      />,
    );

    // Rendered twice: desktop CTA row and the phone plate row.
    const links = screen.getAllByRole("link", { name: "Learn more" });
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/apply");
    }
  });

  it("renders inline links in the supporting copy", () => {
    render(
      <HomeHero
        {...loneVideoButtonHero}
        body={[
          {
            _key: "body",
            _type: "block",
            children: [
              {
                _key: "body-text",
                _type: "span",
                marks: ["apply-link"],
                text: "Apply now",
              },
            ],
            markDefs: [
              {
                _key: "apply-link",
                _type: "customLink",
                href: "/apply",
                openInNewTab: false,
              },
            ],
            style: "normal",
          },
        ]}
      />,
    );

    const links = screen.getAllByRole("link", { name: "Apply now" });
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute("href", "/apply");
  });
});
