import { describe, expect, it } from "vitest";
import { resolveSectionBoundaries, type Block } from "./section-boundaries";

function block(_type: Block["_type"], background?: "white" | "cream" | "green"): Block {
  return { _type, _key: `${_type}-${background ?? "fixed"}`, background } as unknown as Block;
}

let keySeed = 0;

/** A story feature, with or without a photo: only a photo joins a run. */
function story(background: "white" | "cream" | "green" = "cream", photo = true): Block {
  keySeed += 1;
  return {
    _type: "storyFeature",
    _key: `story-${keySeed}`,
    background,
    image: photo ? { asset: { _id: `image-${keySeed}` } } : null,
  } as unknown as Block;
}

function mirrors(blocks: Block[]) {
  return resolveSectionBoundaries(blocks).map((boundary) => boundary.mirror);
}

function booleans(blocks: Block[]) {
  return resolveSectionBoundaries(blocks).map(({ seamTop, seamBottom, tuck, tuckBelow }) => ({
    seamTop,
    seamBottom,
    tuck,
    tuckBelow,
  }));
}

describe("resolveSectionBoundaries", () => {
  it("gives a single section two edges and a tucking footer", () => {
    expect(booleans([block("benefitCards", "cream")])).toEqual([
      { seamTop: false, seamBottom: false, tuck: false, tuckBelow: true },
    ]);
  });

  it("joins two same-background sections at a seam", () => {
    expect(booleans([block("benefitCards", "cream"), block("faqAccordion", "cream")])).toEqual([
      { seamTop: false, seamBottom: true, tuck: false, tuckBelow: false },
      { seamTop: true, seamBottom: false, tuck: false, tuckBelow: true },
    ]);
  });

  it("keeps an edge between two different backgrounds", () => {
    expect(booleans([block("benefitCards", "cream"), block("faqAccordion", "white")])).toEqual([
      { seamTop: false, seamBottom: false, tuck: false, tuckBelow: false },
      { seamTop: false, seamBottom: false, tuck: false, tuckBelow: true },
    ]);
  });

  it("seams a tucker onto a matching background instead of tucking", () => {
    expect(booleans([block("faqAccordion", "cream"), block("featureCards", "cream")])).toEqual([
      { seamTop: false, seamBottom: true, tuck: false, tuckBelow: false },
      { seamTop: true, seamBottom: false, tuck: false, tuckBelow: true },
    ]);
  });

  it("lets a tucker tuck under a different background", () => {
    expect(booleans([block("benefitCards", "green"), block("ctaBanner", "cream")])).toEqual([
      { seamTop: false, seamBottom: false, tuck: false, tuckBelow: true },
      { seamTop: false, seamBottom: false, tuck: true, tuckBelow: true },
    ]);
  });

  it("does not tuck a first section under nothing", () => {
    expect(booleans([block("ctaBanner", "green")])).toEqual([
      { seamTop: false, seamBottom: false, tuck: false, tuckBelow: true },
    ]);
  });

  it("puts an edge after a hero and lets the tucker tuck", () => {
    expect(booleans([block("innerHero"), block("ctaBanner", "cream")])).toEqual([
      { seamTop: false, seamBottom: false, tuck: false, tuckBelow: true },
      { seamTop: false, seamBottom: false, tuck: true, tuckBelow: true },
    ]);
  });

  it("treats the end of the list as an edge before the tucking footer", () => {
    const result = resolveSectionBoundaries([
      block("benefitCards", "white"),
      block("faqAccordion", "white"),
    ]);
    expect(result[1].seamBottom).toBe(false);
    expect(result[1].tuckBelow).toBe(true);
  });

  it("preserves the editor background on a final section", () => {
    const result = resolveSectionBoundaries([
      block("benefitCards", "green"),
      block("faqAccordion", "green"),
    ]);
    expect(result[1].background).toBe("green");
    expect(result[0].seamBottom).toBe(true);
    expect(result[1].seamTop).toBe(true);
  });

  it("compares a fixed-background section by its trait, not the editor field", () => {
    const result = resolveSectionBoundaries([
      block("hero"),
      block("innerHero"),
    ]);
    expect(result[0].background).toBe("photo");
    expect(result[1].background).toBe("photo");
    // Heroes keep their own boundaries even when the background matches.
    expect(result[0].seamBottom).toBe(false);
    expect(result[1].seamTop).toBe(false);
    expect(result[1].tuck).toBe(false);
    expect(result[0].tuckBelow).toBe(false);
  });
});

describe("resolveSectionBoundaries mirror", () => {
  it("leaves a lone story feature unmirrored", () => {
    expect(mirrors([story()])).toEqual([false]);
  });

  it("mirrors the second of two consecutive story features", () => {
    expect(mirrors([story(), story()])).toEqual([false, true]);
  });

  it("mirrors only the middle of three", () => {
    expect(mirrors([story(), story(), story()])).toEqual([false, true, false]);
  });

  it("ends the run at a story feature without a photo", () => {
    expect(mirrors([story("cream", true), story("cream", false), story("cream", true)])).toEqual([
      false,
      false,
      false,
    ]);
  });

  it("ends the run at a section of a different type", () => {
    expect(mirrors([story(), block("benefitCards", "cream"), story()])).toEqual([
      false,
      false,
      false,
    ]);
  });

  it("ignores background when counting positions in a run", () => {
    expect(mirrors([story("cream"), story("green"), story("cream")])).toEqual([
      false,
      true,
      false,
    ]);
  });

  it("starts a fresh run after a hero", () => {
    expect(mirrors([block("innerHero"), story(), story()])).toEqual([false, false, true]);
  });

  it("does not mirror a section type without the alternate trait", () => {
    expect(mirrors([block("benefitCards", "cream"), block("benefitCards", "cream")])).toEqual([
      false,
      false,
    ]);
  });
});
