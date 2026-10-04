import { describe, expect, it } from "vitest";
import { createFooterModel, type RawFooter } from "./model";

const rawLink = (
  key: string,
  label: string,
  href: string,
  openInNewTab = false,
) => ({ _key: key, label, destination: { href, openInNewTab } });

const rawFooter: RawFooter = {
  _id: "footer",
  eyebrow: "Your next chapter",
  heading: "Until next summer,",
  accent: "see you on the island",
  actions: [rawLink("enroll", "Enroll", "https://example.com", true)],
  logos: [
    {
      _key: "site",
      alt: "Maplewood Year Round",
      image: {
        asset: {
          _id: "image-4477c44717fcc82a76174b8fa4bc4dc323b05c6b-2182x1006-png",
          metadata: { dimensions: { width: 2182, height: 1006 } },
        },
      },
      destination: { href: "/", openInNewTab: false },
    },
  ],
  contactLinks: [
    {
      _key: "address",
      icon: "pin",
      label: "10 Main Street\nExample City",
      destination: { href: "https://maps.example.com", openInNewTab: true },
    },
  ],
  columns: [
    {
      _key: "company",
      heading: "Company",
      links: [
        rawLink("about", "About", "about"),
        rawLink("unsafe", "Unsafe", "javascript:alert(1)"),
      ],
    },
  ],
  legalLinks: [rawLink("privacy", "Privacy", "/privacy")],
  copyrightStartYear: 2024,
  copyrightOwner: "Northline Studio",
};

describe("createFooterModel", () => {
  it.each([
    "\\evil.example",
    "/\\evil.example",
    "//evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
  ])("omits unsafe authored destinations: %j", (href) => {
    const model = createFooterModel(
      {
        ...rawFooter,
        columns: [
          {
            _key: "links",
            heading: "Links",
            links: [
              rawLink("safe", "About", "/about"),
              rawLink("unsafe", "Unsafe", href),
            ],
          },
        ],
      },
      2026,
    );
    expect(model?.columns[0]?.links.map((item) => item.href)).toEqual([
      "/about",
    ]);
  });

  it("builds the footer from authored links, logos, and contact rows", () => {
    const model = createFooterModel(rawFooter, 2026);

    expect(model?.columns[0]?.links).toEqual([
      {
        href: "/about",
        key: "about",
        label: "About",
        openInNewTab: false,
      },
    ]);
    expect(model?.logos[0]?.alt).toBe("Maplewood Year Round");
    expect(model?.contactLinks[0]?.link.label).toBe(
      "10 Main Street\nExample City",
    );
    expect(model?.actions[0]?.openInNewTab).toBe(true);
    expect(model?.copyrightYears).toBe("2024-2026");
  });

  it("returns unavailable when required footer data is missing", () => {
    expect(createFooterModel(null, 2026)).toBeNull();
    expect(
      createFooterModel({ ...rawFooter, copyrightOwner: null }, 2026),
    ).toBeNull();
    expect(createFooterModel({ ...rawFooter, columns: [] }, 2026)).toBeNull();
  });

  it("accepts a footer without the starter sign-off or linked badge", () => {
    const model = createFooterModel(
      {
        ...rawFooter,
        eyebrow: null,
        heading: null,
        accent: null,
        actions: [],
        logos: rawFooter.logos?.map((logo) => ({ ...logo, destination: null })),
      },
      2026,
      { contact: { fax: "508-238-1154" } },
    );
    expect(model?.logos).toHaveLength(1);
    expect(model?.logos[0].link).toBeNull();
    expect(model?.contact?.fax).toBe("508-238-1154");
  });
});
