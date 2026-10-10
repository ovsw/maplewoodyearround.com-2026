import { describe, expect, it } from "vitest";
// Every icon the Studio picker offers, as it is stored with the content.
import pickerSvgs from "../../../studio/schemas/inputs/material-icons.json";
import { isSafeIconSvg } from "./safe-icon-svg";

describe("isSafeIconSvg", () => {
  it("accepts every icon the Studio picker offers", () => {
    const rejected = Object.entries(pickerSvgs)
      .filter(([, svg]) => !isSafeIconSvg(svg))
      .map(([name]) => name);
    expect(rejected).toEqual([]);
  });

  it("rejects event-handler attributes", () => {
    expect(
      isSafeIconSvg('<svg viewBox="0 0 24 24" onload="alert(1)"></svg>'),
    ).toBe(false);
  });

  it("rejects unquoted attributes that hide handlers", () => {
    expect(isSafeIconSvg("<svg/onload=alert(1)></svg>")).toBe(false);
    expect(isSafeIconSvg('<svg d="x"onload="alert(1)"></svg>')).toBe(false);
  });

  it("rejects elements outside the drawing allowlist", () => {
    expect(isSafeIconSvg("<svg><script>alert(1)</script></svg>")).toBe(false);
    expect(
      isSafeIconSvg('<svg><foreignObject><div id="x"></div></foreignObject></svg>'),
    ).toBe(false);
    expect(isSafeIconSvg('<svg><use href="#evil"></use></svg>')).toBe(false);
    expect(isSafeIconSvg('<svg><a href="javascript:alert(1)">x</a></svg>')).toBe(
      false,
    );
  });

  it("rejects style and link attributes", () => {
    expect(
      isSafeIconSvg('<svg style="background:url(javascript:alert(1))"></svg>'),
    ).toBe(false);
    expect(isSafeIconSvg('<svg><path href="#x" d="M0 0"></path></svg>')).toBe(
      false,
    );
  });

  it("rejects markup that is not a bare svg document", () => {
    expect(isSafeIconSvg('<script>alert(1)</script>')).toBe(false);
    expect(isSafeIconSvg(`${pickerSvgs.pool}<img src="x">`)).toBe(false);
    expect(isSafeIconSvg("plain text")).toBe(false);
  });
});
