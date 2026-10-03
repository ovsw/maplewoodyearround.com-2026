import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("keeps design-system text utilities next to a text colour", () => {
    expect(cn("mb-5 text-eyebrow", "text-link")).toBe(
      "mb-5 text-eyebrow text-link",
    );
    expect(cn("text-label", "text-foreground/60")).toBe(
      "text-label text-foreground/60",
    );
    expect(cn("text-step-number", "text-link")).toBe(
      "text-step-number text-link",
    );
  });

  it("still lets a later typography utility replace an earlier one", () => {
    expect(cn("text-title", "text-title-lg")).toBe("text-title-lg");
    expect(cn("text-sm", "text-headline")).toBe("text-headline");
  });
});
