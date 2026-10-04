import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HeaderBrand } from "./brand";
import { Header } from "./site-header";
import type { HeaderModel } from "./model";

const model: HeaderModel = {
  brand: {
    dark: null,
    label: "Northline",
    light: null,
  },
  navigation: {
    items: [
      {
        key: "contact",
        kind: "link",
        label: "Contact",
        link: { href: "/contact", label: "Contact", openInNewTab: false },
      },
      {
        key: "services",
        kind: "group",
        label: "Services",
        links: [
          {
            key: "strategy",
            label: "Strategy",
            description: "Find the clearest path through a hard problem.",
            icon: null,
            link: {
              href: "/strategy",
              label: "Strategy",
              openInNewTab: false,
            },
          },
        ],
      },
    ],
    actions: [
      {
        key: "schedule",
        link: {
          href: "https://example.com/book",
          label: "Start a project",
          openInNewTab: true,
        },
      },
    ],
  },
};

describe("Site Header", () => {
  it("shows the authored logo or a text fallback", () => {
    const { rerender } = render(<HeaderBrand brand={model.brand} />);

    expect(screen.getByText("Northline")).toBeInTheDocument();

    rerender(
      <HeaderBrand
        brand={{
          ...model.brand,
          light: {
            src: "https://cdn.sanity.io/images/example/logo.png",
            width: 216,
            height: 48,
          },
        }}
      />,
    );

    expect(screen.getByRole("img", { name: "Northline" })).toBeInTheDocument();
    expect(screen.queryByText("Northline")).not.toBeInTheDocument();
  });

  it("opens the menu, keeps authored links safe, and restores focus on Escape", async () => {
    const user = userEvent.setup();
    render(<Header model={model} />);
    const trigger = screen.getByRole("button", { name: "Open menu" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const action = screen.getByRole("link", { name: "Start a project" });
    expect(action).toHaveAttribute("rel", "noopener noreferrer");
    expect(action).toHaveAttribute("target", "_blank");
    await user.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "Main navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(
      screen.getByRole("heading", { name: "Services" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Strategy" })).toHaveAttribute(
      "href",
      "/strategy",
    );
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes the menu when a destination is chosen", async () => {
    const user = userEvent.setup();
    render(<Header model={model} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("link", { name: "Contact" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("uses the light header and accepts an explicit theme", () => {
    const { rerender } = render(<Header model={model} />);
    expect(screen.getByRole("banner")).toHaveAttribute("data-theme", "light");
    rerender(<Header model={model} theme="dark" />);
    expect(screen.getByRole("banner")).toHaveAttribute("data-theme", "dark");
  });
});
