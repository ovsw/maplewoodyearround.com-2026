import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import StackedFeatureRows from "./stacked-feature-rows";

const iconSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-9"/><path d="M14 17H5"/></svg>';

const block: ComponentProps<typeof StackedFeatureRows> = {
  _key: "parent-details",
  _type: "stackedFeatureRows",
  background: "cream",
  eyebrow: "Camp details",
  title: [
    {
      _key: "heading",
      _type: "block",
      style: "normal",
      markDefs: null,
      children: [
        {
          _key: "plain",
          _type: "span",
          marks: [],
          text: "Built for kids. ",
        },
        {
          _key: "accent",
          _type: "span",
          marks: ["em"],
          text: "Trusted by parents.",
        },
      ],
    },
  ],
  rows: [
    {
      _key: "accredited",
      icon: {
        name: "badge-check",
        svg: iconSvg,
      },
      title: "Accredited & inspected",
      items: [
        {
          _key: "oca",
          body: [
            {
              _key: "oca-body",
              _type: "block",
              style: "normal",
              markDefs: [
                {
                  _key: "oca-link",
                  _type: "customLink",
                  href: "https://ontariocampsassociation.ca/",
                  openInNewTab: true,
                },
              ],
              children: [
                {
                  _key: "oca-text",
                  _type: "span",
                  marks: ["oca-link"],
                  text: "OCA accredited",
                },
              ],
            },
          ],
        },
      ],
      link: {
        text: "Our accreditations",
        href: "/accreditations",
        openInNewTab: false,
      },
    },
  ],
  dataAttribute: (path) => `section:${path}`,
};

describe("StackedFeatureRows", () => {
  it("renders its heading, rows, links, and keyed editing paths", () => {
    render(<StackedFeatureRows {...block} />);

    expect(
      screen.getByRole("heading", {
        name: "Built for kids. Trusted by parents.",
      }),
    ).toBeInTheDocument();
    const rowHeading = screen.getByText("Accredited & inspected");
    expect(rowHeading).toHaveAttribute(
      "data-sanity",
      'section:rows[_key=="accredited"].title',
    );
    expect(
      screen.getByText("OCA accredited").closest("[data-sanity]"),
    ).toHaveAttribute(
      "data-sanity",
      'section:rows[_key=="accredited"].items[_key=="oca"].body',
    );
    expect(
      screen.getByRole("link", { name: "OCA accredited" }),
    ).toHaveAttribute("href", "https://ontariocampsassociation.ca/");
    expect(document.querySelector('[data-sanity$=".icon"]')).not.toBeNull();
    expect(document.querySelector(".lucide-check")).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "Our accreditations" }),
    ).toHaveAttribute("href", "/accreditations");
  });

  it("omits rows without points", () => {
    render(
      <StackedFeatureRows
        {...block}
        rows={[
          ...(block.rows ?? []),
          {
            _key: "missing-items",
            icon: null,
            title: "Missing items",
            items: [
              {
                _key: "detail",
                body: null,
              },
            ],
            link: null,
          },
        ]}
      />,
    );

    expect(screen.queryByText("Missing items")).not.toBeInTheDocument();
  });

  it("renders a row without a link", () => {
    render(
      <StackedFeatureRows
        {...block}
        rows={[{ ...(block.rows ?? [])[0], link: null }]}
      />,
    );

    expect(screen.getByText("Accredited & inspected")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Our accreditations" }),
    ).not.toBeInTheDocument();
  });

  it("omits supporting points with blank rich text", () => {
    render(
      <StackedFeatureRows
        {...block}
        rows={[
          {
            ...(block.rows ?? [])[0],
            items: [
              ...((block.rows ?? [])[0]?.items ?? []),
              {
                _key: "blank",
                body: [
                  {
                    _key: "blank-body",
                    _type: "block",
                    style: "normal",
                    markDefs: [],
                    children: [
                      {
                        _key: "blank-text",
                        _type: "span",
                        marks: [],
                        text: "   ",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]}
      />,
    );

    expect(document.querySelectorAll(".lucide-check")).toHaveLength(1);
  });
});
