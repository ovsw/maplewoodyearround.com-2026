import { render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchHomePage } from "@/sanity/lib/fetch";
import IndexPage from "./page";

vi.mock("@/components/blocks", () => ({
  default: ({ blocks }: { blocks: Array<{ _type: string }> }) => (
    <div data-testid="blocks">{blocks.map((block) => block._type).join(",")}</div>
  ),
}));
vi.mock("@/components/faq-json-ld", () => ({ default: () => null }));
vi.mock("@/components/video-json-ld", () => ({ default: () => null }));
vi.mock("@/components/website-json-ld", () => ({ default: () => null }));
vi.mock("@/sanity/lib/fetch", () => ({ fetchHomePage: vi.fn() }));
vi.mock("@/sanity/lib/live", () => ({
  getDynamicFetchOptions: vi.fn(),
  sanityFetchMetadata: vi.fn(),
}));
vi.mock("next/headers", () => ({
  draftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not found");
  },
}));

describe("home page", () => {
  beforeEach(() => vi.mocked(fetchHomePage).mockReset());

  async function renderIndexPage() {
    const routeElement = (await IndexPage()) as ReactElement;
    const renderRoute = routeElement.type as (
      props: unknown,
    ) => Promise<ReactNode>;
    return render(await renderRoute(routeElement.props));
  }

  it("renders an empty site when the home document is not yet published", async () => {
    vi.mocked(fetchHomePage).mockResolvedValueOnce(null);
    await renderIndexPage();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Our new website is being prepared.")).toBeInTheDocument();
  });

  it("renders Page Builder sections and a title fallback without a hero", async () => {
    vi.mocked(fetchHomePage).mockResolvedValueOnce({
      _id: "homePage",
      _type: "homePage",
      blocks: [{ _key: "intro", _type: "richText" }],
      title: "Maplewood Year Round",
    } as never);

    const { container } = await renderIndexPage();

    expect(container.querySelector("header")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Maplewood Year Round", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("blocks")).toHaveTextContent("richText");
  });

  it("lets a hero own the page heading", async () => {
    vi.mocked(fetchHomePage).mockResolvedValueOnce({
      _id: "homePage",
      _type: "homePage",
      blocks: [{ _key: "hero", _type: "homeHero" }],
      title: "Maplewood Year Round",
    } as never);

    await renderIndexPage();

    expect(
      screen.queryByRole("heading", { name: "Maplewood Year Round", level: 1 }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("blocks")).toHaveTextContent("homeHero");
  });
});
