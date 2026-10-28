import { beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import {
  perspectiveChangeAction,
  variantChangeAction,
} from "next-sanity/visual-editing/server-actions";
import { perspectiveChange, variantChange } from "./preview-actions";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next-sanity/visual-editing/server-actions", () => ({
  perspectiveChangeAction: vi.fn(),
  variantChangeAction: vi.fn(),
}));

const jar = (values: Record<string, string>) => ({
  get: (name: string) => (name in values ? { value: values[name] } : undefined),
});

describe("preview actions", () => {
  beforeEach(() => {
    vi.mocked(perspectiveChangeAction).mockReset();
    vi.mocked(variantChangeAction).mockReset();
  });

  it("does nothing when Presentation repeats the perspective already stored", async () => {
    vi.mocked(cookies).mockResolvedValue(jar({ "sanity-preview-perspective": "drafts" }) as never);
    await perspectiveChange("drafts");
    await perspectiveChange(["drafts"]);
    expect(perspectiveChangeAction).not.toHaveBeenCalled();
  });

  it("stores a perspective that changed", async () => {
    vi.mocked(cookies).mockResolvedValue(jar({ "sanity-preview-perspective": "drafts" }) as never);
    await perspectiveChange(["rXYZ", "drafts"]);
    expect(perspectiveChangeAction).toHaveBeenCalledWith(["rXYZ", "drafts"]);
  });

  it("stores the first perspective of a session", async () => {
    vi.mocked(cookies).mockResolvedValue(jar({}) as never);
    await perspectiveChange("drafts");
    expect(perspectiveChangeAction).toHaveBeenCalledWith("drafts");
  });

  it("treats no variant and an empty variant as the same", async () => {
    vi.mocked(cookies).mockResolvedValue(jar({}) as never);
    await variantChange(undefined);
    await variantChange("");
    expect(variantChangeAction).not.toHaveBeenCalled();
    await variantChange("Ab12cd34");
    expect(variantChangeAction).toHaveBeenCalledWith("Ab12cd34");
  });
});
