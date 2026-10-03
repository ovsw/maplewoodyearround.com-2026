import { describe, expect, it } from "vitest";
import { isSafeIconSvg } from "./safe-icon-svg";

const lucideSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-key" aria-hidden="true"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"></path><circle cx="7.5" cy="15.5" r="5.5"></circle></svg>';

const campSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true"><path d="M96 448c-19.2 0-32-12.8-32-32z" opacity=".4"></path><path d="M96 384h328a24 24 0 0024-24z"></path></svg>';

describe("isSafeIconSvg", () => {
  it("accepts markup the Studio picker produces", () => {
    expect(isSafeIconSvg(lucideSvg)).toBe(true);
    expect(isSafeIconSvg(campSvg)).toBe(true);
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
    expect(isSafeIconSvg(`${lucideSvg}<img src="x">`)).toBe(false);
    expect(isSafeIconSvg("plain text")).toBe(false);
  });
});
