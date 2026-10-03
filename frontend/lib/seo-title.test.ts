import { describe, expect, it } from "vitest";
import {
  getSeoTitleWarnings,
  resolveSeoTitle,
  stripLegacySeoTitleSuffix,
} from "../../shared/seo-title";

describe("resolveSeoTitle", () => {
  it("uses a page override with the site name suffix", () => {
    expect(
      resolveSeoTitle({
        fallbackTitle: "Services",
        overrideTitle: "Custom services",
      }),
    ).toMatchObject({
      finalTitle: "Custom services | Maplewood",
      metadataTitle: "Custom services",
      pageTitle: "Custom services",
    });
  });

  it("uses a pipe-bearing override as a complete title", () => {
    expect(
      resolveSeoTitle({ overrideTitle: "About | Example Company" }),
    ).toMatchObject({
      finalTitle: "About | Example Company",
      metadataTitle: { absolute: "About | Example Company" },
    });
  });

  it("returns the site name when no page title exists", () => {
    expect(resolveSeoTitle({}).metadataTitle).toEqual({
      absolute: "Maplewood",
    });
  });

  it("removes a repeated site name suffix", () => {
    expect(
      stripLegacySeoTitleSuffix(
        "About | Maplewood | Maplewood",
      ),
    ).toBe("About");
  });
});

describe("getSeoTitleWarnings", () => {
  it("warns about repeated generic terms and long titles", () => {
    const warnings = getSeoTitleWarnings({
      fallbackTitle: "Fallback",
      overrideTitle:
        "Company website services for every company website requirement today",
    });

    expect(warnings).toEqual([
      "Review the repeated term “website” for readability.",
      "The final 80-character title may be shortened in search results.",
    ]);
  });
});
