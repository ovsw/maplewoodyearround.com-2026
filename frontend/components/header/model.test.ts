import { describe, expect, it } from "vitest";
import { createHeaderBrandModel, createHeaderNavigationModel } from "./model";
import { siteName } from "@/lib/site-name";

const testSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 22h18"></path></svg>';

describe("createHeaderNavigationModel", () => {
  it.each([
    "\\evil.example",
    "/\\evil.example",
    "//evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
  ])("omits unsafe authored destinations: %j", (href) => {
    const model = createHeaderNavigationModel({
      items: [
        {
          _key: "unsafe",
          kind: "link",
          label: "Unsafe",
          destination: { href },
        },
      ],
      actions: [
        { _key: "unsafe-action", label: "Unsafe", destination: { href } },
      ],
    });
    expect(model.items).toEqual([]);
    expect(model.actions).toEqual([]);
  });

  it("maps direct links, rich groups, actions, and normalized destinations", () => {
    const model = createHeaderNavigationModel({
      _id: "navigation",
      items: [
        {
          _key: "contact",
          kind: "link",
          label: "Contact",
          destination: { href: "contact", openInNewTab: false },
        },
        {
          _key: "services",
          kind: "group",
          label: "Services",
          links: [
            {
              _key: "strategy",
              label: "Strategy",
              description: "Find the clearest path through a hard problem.",
              icon: { name: "shield-check", svg: testSvg },
              destination: { href: "/strategy", openInNewTab: false },
            },
          ],
        },
      ],
      actions: [
        {
          _key: "schedule",
          label: "Start a project",
          destination: {
            href: "https://example.com/book",
            openInNewTab: true,
          },
        },
      ],
    });

    expect(model).toEqual({
      items: [
        {
          key: "contact",
          kind: "link",
          label: "Contact",
          link: { href: "/contact", label: "Contact", openInNewTab: false },
        },
        {
          key: "services",
          kind: "group",
          label: "Services",
          links: [
            {
              key: "strategy",
              label: "Strategy",
              description: "Find the clearest path through a hard problem.",
              icon: { name: "shield-check", svg: testSvg },
              link: {
                href: "/strategy",
                label: "Strategy",
                openInNewTab: false,
              },
            },
          ],
        },
      ],
      actions: [
        {
          key: "schedule",
          link: {
            href: "https://example.com/book",
            label: "Start a project",
            openInNewTab: true,
          },
        },
      ],
    });
  });

  it("keeps both configurable actions", () => {
    const model = createHeaderNavigationModel({
      _id: "navigation",
      items: [],
      actions: [
        {
          _key: "enroll",
          label: "Enroll",
          destination: { href: "https://example.com/enroll" },
        },
        {
          _key: "extra",
          label: "Extra",
          destination: { href: "/extra" },
        },
      ],
    });

    expect(model.actions.map((action) => action.link.href)).toEqual([
      "https://example.com/enroll",
      "/extra",
    ]);
  });

  it("omits invalid destinations and structurally empty groups", () => {
    const model = createHeaderNavigationModel({
      _id: "navigation",
      items: [
        {
          _key: "broken",
          kind: "link",
          label: "Broken",
          destination: { href: "#", openInNewTab: false },
        },
        {
          _key: "empty",
          kind: "group",
          label: "Empty",
          links: [],
        },
      ],
      actions: [],
    });

    expect(model).toEqual({ items: [], actions: [] });
  });

  it("uses authored identity and supports settings documents from before siteName", () => {
    expect(createHeaderBrandModel(null)).toBeNull();
    expect(
      createHeaderBrandModel({ siteName: "Northline", logo: null } as never),
    ).toEqual({ dark: null, label: "Northline", light: null });
    expect(
      createHeaderBrandModel({ siteName: null, logo: null } as never),
    ).toEqual({ dark: null, label: siteName, light: null });
  });
});
