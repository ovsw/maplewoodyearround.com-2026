import type { PortableTextProps } from "@portabletext/react";
import { describe, expect, it } from "vitest";
import { createPostBodyModel, getPostReadTime } from "./model";

function heading(key: string, style: string, text: string) {
  return {
    _key: key,
    _type: "block",
    children: [{ _key: `${key}-span`, _type: "span", marks: [], text }],
    markDefs: [],
    style,
  };
}

describe("createPostBodyModel", () => {
  it("omits empty and unsupported headings", () => {
    const zero = createPostBodyModel([
      heading("normal", "normal", "Not a heading"),
      heading("empty", "h2", "   "),
    ] as PortableTextProps["value"]);
    const one = createPostBodyModel([
      heading("valid", "h2", "Only heading"),
    ] as PortableTextProps["value"]);

    expect(zero.headings).toEqual([]);
    expect(zero.showTableOfContents).toBe(false);
    expect(one.headings).toHaveLength(1);
    expect(one.showTableOfContents).toBe(false);
  });

  it("shows the table of contents at exactly three headings, not two", () => {
    const two = createPostBodyModel([
      heading("first", "h2", "First heading"),
      heading("second", "h2", "Second heading"),
    ] as PortableTextProps["value"]);
    const three = createPostBodyModel([
      heading("first", "h2", "First heading"),
      heading("second", "h2", "Second heading"),
      heading("third", "h2", "Third heading"),
    ] as PortableTextProps["value"]);

    expect(two.showTableOfContents).toBe(false);
    expect(three.showTableOfContents).toBe(true);
  });

  it("preserves source order and nests headings according to their levels", () => {
    const model = createPostBodyModel([
      heading("first", "h2", "First section"),
      heading("child", "h3", "Child section"),
      heading("grandchild", "h5", "Deep section"),
      heading("second", "h2", "Second section"),
    ] as PortableTextProps["value"]);

    expect(model.showTableOfContents).toBe(true);
    expect(model.headings.map(({ id, level, text }) => ({ id, level, text }))).toEqual([
      { id: "first-section", level: 2, text: "First section" },
      { id: "second-section", level: 2, text: "Second section" },
    ]);
    expect(model.headings[0]?.children[0]).toMatchObject({
      id: "child-section",
      level: 3,
      text: "Child section",
    });
    expect(model.headings[0]?.children[0]?.children[0]).toMatchObject({
      id: "deep-section",
      level: 5,
      text: "Deep section",
    });
  });

  it("creates deterministic IDs for duplicate text and text with an empty slug", () => {
    const blocks = [
      heading("repeat-1", "h2", "Repeat"),
      heading("literal-suffix", "h3", "Repeat 2"),
      heading("repeat-2", "h3", "Repeat"),
      heading("symbol", "h3", "💰"),
    ];
    const model = createPostBodyModel(blocks as PortableTextProps["value"]);

    expect(blocks.map((block) => model.getHeadingId(block))).toEqual([
      "repeat",
      "repeat-2",
      "repeat-3",
      "heading-4",
    ]);
  });
});

describe("getPostReadTime", () => {
  const stegaMarker = "\u200b\u200c\u200d\u2062";

  it("counts cleaned Portable Text span words at 200 words per minute", () => {
    const words = Array.from({ length: 300 }, (_, index) =>
      index === 20 ? `word${stegaMarker}` : "word",
    ).join(" ");

    expect(getPostReadTime([heading("body", "normal", words)] as PortableTextProps["value"])).toBe(
      "2 min read",
    );
  });

  it("ignores embedded non-text blocks", () => {
    const body = [
      heading("body", "normal", "Count only these words"),
      { _key: "image", _type: "image", children: [{ _type: "span", text: "ignore me" }] },
    ] as PortableTextProps["value"];

    expect(getPostReadTime(body)).toBe("1 min read");
  });

  it.each([
    ["an empty body", []],
    ["a short body", [heading("body", "normal", "One short sentence")]],
  ])("keeps the one-minute floor for %s", (_label, body) => {
    expect(getPostReadTime(body as PortableTextProps["value"])).toBe("1 min read");
  });
});
