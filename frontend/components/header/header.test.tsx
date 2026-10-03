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

  });

  it("renders authored identity, interactive navigation, and safe actions", async () => {
    const user = userEvent.setup();
    render(<Header model={model} />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Northline home page" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
    await user.click(screen.getByRole("button", { name: "Services" }));

    expect(
      await screen.findByText("Find the clearest path through a hard problem."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Strategy/ })).toHaveAttribute(
      "href",
      "/strategy",
    );

    const action = screen.getByRole("link", { name: "Start a project" });
    expect(action).toHaveAttribute("href", "https://example.com/book");
    expect(action).toHaveAttribute("rel", "noopener noreferrer");
    expect(action).toHaveAttribute("target", "_blank");
    expect(document.querySelector('a[href="#"]')).not.toBeInTheDocument();
  });

  it("uses the dark theme by default and accepts the light theme", () => {
    const { rerender } = render(<Header model={model} />);

    expect(screen.getByRole("banner")).toHaveAttribute("data-theme", "dark");

    rerender(<Header model={model} theme="light" />);

    expect(screen.getByRole("banner")).toHaveAttribute("data-theme", "light");
  });

  it("balances long desktop submenus across two columns", async () => {
    const user = userEvent.setup();
    const links = Array.from({ length: 8 }, (_, index) => ({
      key: `planning-${index}`,
      label: `Planning link ${index + 1}`,
      description: `Planning description ${index + 1}`,
      icon: null,
      link: {
        href: `/planning-${index}`,
        label: `Planning link ${index + 1}`,
        openInNewTab: false,
      },
    }));
    const balancedModel: HeaderModel = {
      ...model,
      navigation: {
        ...model.navigation,
        items: [
          {
            key: "planning",
            kind: "group",
            label: "Planning",
            links,
          },
        ],
      },
    };
    const { container } = render(<Header model={balancedModel} />);

    await user.click(screen.getByRole("button", { name: "Planning" }));

    const columns = container.querySelector(".grid-cols-2");
    expect(columns).not.toBeNull();
    expect(Array.from(columns?.children ?? []).map((column) => column.children.length)).toEqual([
      4, 4,
    ]);
  });
});
