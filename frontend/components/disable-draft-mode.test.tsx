import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DisableDraftMode } from "./disable-draft-mode";

vi.mock("@/app/actions/disable-draft-mode", () => ({
  disableDraftMode: vi.fn(),
}));
// A tab opened from Studio stays linked to Presentation, so the hook reports
// true there as well as inside Studio's preview panel.
vi.mock("next-sanity/hooks", () => ({ useIsPresentationTool: () => true }));

describe("disable draft mode button", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows in a tab opened from Studio", () => {
    render(<DisableDraftMode />);

    expect(
      screen.getByRole("button", { name: "Disable Draft Mode" }),
    ).toBeInTheDocument();
  });

  it("hides inside Studio's preview panel", () => {
    vi.stubGlobal("top", {});

    render(<DisableDraftMode />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
