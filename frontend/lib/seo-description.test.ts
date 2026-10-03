import { describe, expect, it } from "vitest";
import {
  portableTextToPlainText,
  resolveSeoDescription,
} from "../../shared/seo-description";

// Studio's effective-description panel and Website metadata share these rules.
describe("resolveSeoDescription", () => {
  it.each([
    [{ seoDescription: "SEO", contentDescription: "Page", siteDescription: "Site" }, "SEO", "seo"],
    [{ seoDescription: " \n", contentDescription: "Page", siteDescription: "Site" }, "Page", "content"],
    [{ seoDescription: null, contentDescription: "  ", siteDescription: " Site " }, "Site", "site"],
    [{}, undefined, undefined],
  ])("resolves %j", (input, description, source) => {
    expect(resolveSeoDescription(input)).toEqual(
      description ? { description, source } : {},
    );
  });
});

describe("portableTextToPlainText", () => {
  it("joins block text with blank lines, like GROQ pt::text", () => {
    expect(
      portableTextToPlainText([
        { _type: "block", children: [{ text: "Swim " }, { text: "daily." }] },
        { _type: "image" },
        { _type: "block", children: [{ text: "Sleep well." }] },
      ]),
    ).toBe("Swim daily.\n\nSleep well.");
    expect(portableTextToPlainText(undefined)).toBe("");
  });
});
