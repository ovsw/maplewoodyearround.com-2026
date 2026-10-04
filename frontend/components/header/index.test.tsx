import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { CachedHeader } from "./index";

vi.mock("@/sanity/lib/live", () => ({ getDynamicFetchOptions: vi.fn() }));
vi.mock("@/sanity/lib/fetch", () => ({
  fetchSanitySettings: vi.fn(async () => ({
    siteName: "Maplewood",
    socialLinks: [
      { label: "   ", url: "https://instagram.com/blank" },
      { label: " Instagram ", url: "https://instagram.com/maplewood" },
      { label: "Unsafe", url: "javascript:alert(1)" },
    ],
  })),
  fetchSanityNavigation: vi.fn(async () => null),
}));

it("omits blank social names and unsafe URLs, and trims valid names", async () => {
  render(await CachedHeader({ perspective: "published", stega: false }));
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Open menu" }));
  expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute(
    "href",
    "https://instagram.com/maplewood",
  );
  expect(
    document.querySelector('a[href="https://instagram.com/blank"]'),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Unsafe" }),
  ).not.toBeInTheDocument();
});
