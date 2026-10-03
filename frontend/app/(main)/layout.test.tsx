import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { draftMode } from "next/headers";
import MainLayout from "./layout";

vi.mock("@/components/header", () => ({
  CachedHeader: () => <div data-testid="cached-header" />,
  DynamicHeader: () => <div data-testid="dynamic-header" />,
}));
vi.mock("@/components/footer", () => ({
  CachedFooter: () => <div data-testid="cached-footer" />,
  DynamicFooter: () => <div data-testid="dynamic-footer" />,
}));
vi.mock("@/components/disable-draft-mode", () => ({
  DisableDraftMode: () => <div data-testid="disable-draft-mode" />,
}));
vi.mock("@/sanity/lib/live", () => ({
  SanityLive: ({ includeDrafts }: { includeDrafts: boolean }) => (
    <div data-include-drafts={String(includeDrafts)} data-testid="sanity-live" />
  ),
}));
vi.mock("next-sanity/visual-editing", () => ({
  VisualEditing: () => <div data-testid="visual-editing" />,
}));
vi.mock("next/headers", () => ({ draftMode: vi.fn() }));

describe("main layout", () => {
  beforeEach(() => vi.mocked(draftMode).mockReset());

  it("enables live drafts and editing controls only in draft mode", async () => {
    vi.mocked(draftMode).mockResolvedValueOnce({ isEnabled: true } as never);

    render(await MainLayout({ children: <p>Page content</p> }));

    expect(screen.getByTestId("dynamic-header")).toBeInTheDocument();
    expect(screen.getByTestId("dynamic-footer")).toBeInTheDocument();
    expect(screen.getByTestId("sanity-live")).toHaveAttribute(
      "data-include-drafts",
      "true",
    );
    expect(screen.getByTestId("disable-draft-mode")).toBeInTheDocument();
    expect(screen.getByTestId("visual-editing")).toBeInTheDocument();
  });

  it("keeps published cache invalidation active after the main content", async () => {
    vi.mocked(draftMode).mockResolvedValueOnce({ isEnabled: false } as never);

    const { container } = render(
      await MainLayout({ children: <p>Page content</p> }),
    );
    const main = container.querySelector("main");
    const sanityLive = screen.getByTestId("sanity-live");

    expect(screen.getByTestId("cached-header")).toBeInTheDocument();
    expect(screen.getByTestId("cached-footer")).toBeInTheDocument();
    expect(sanityLive).toHaveAttribute("data-include-drafts", "false");
    expect(main).not.toBeNull();
    expect(
      main!.compareDocumentPosition(sanityLive) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.queryByTestId("visual-editing")).not.toBeInTheDocument();
  });

  it("keeps the skip link hidden until keyboard focus", async () => {
    vi.mocked(draftMode).mockResolvedValueOnce({ isEnabled: false } as never);

    render(await MainLayout({ children: <p>Page content</p> }));

    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveClass(
      "-translate-y-[calc(100%+2rem)]",
      "focus:translate-y-0",
    );
  });
});
