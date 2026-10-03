import type { PortableTextProps } from "@portabletext/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RichTextContent from "./rich-text-content";

function callout(title: string | null, body: string | null) {
  return [
    {
      _key: "callout",
      _type: "callout",
      body,
      title,
    },
  ] as PortableTextProps["value"];
}

describe("RichTextContent", () => {
  it("requests a bounded Sanity image while preserving its intrinsic ratio", () => {
    render(
      <RichTextContent
        value={[
          {
            _key: "photo",
            _type: "image",
            alt: "Campers on the lake",
            resolvedAsset: {
              _id: "image-abc-3200x1800-jpg",
              url: "https://cdn.sanity.io/images/test/production/abc-3200x1800.jpg",
              metadata: { dimensions: { height: 1800, width: 3200 } },
            },
          },
        ] as PortableTextProps["value"]}
      />,
    );

    const image = screen.getByRole("img", { name: "Campers on the lake" });
    expect(image).toHaveAttribute("width", "3200");
    expect(image).toHaveAttribute("height", "1800");
    const src = decodeURIComponent(image.getAttribute("src") ?? "");
    expect(src).toContain("w=1600");
    expect(src).toContain("fit=max");
  });

  it("renders blockquotes as quote content", () => {
    render(
      <RichTextContent
        value={[
          {
            _key: "quote",
            _type: "block",
            children: [
              {
                _key: "quote-text",
                _type: "span",
                marks: [],
                text: "Camp is a second home.",
              },
            ],
            markDefs: [],
            style: "blockquote",
          },
        ]}
      />,
    );

    expect(screen.getByText("Camp is a second home.").tagName).toBe("BLOCKQUOTE");
  });

  it("renders callouts as aside content", () => {
    const { container } = render(
      <RichTextContent value={callout("Important", "Keep this in mind.")} />,
    );

    const aside = container.querySelector("aside");
    expect(aside).toBeInTheDocument();
    expect(screen.getByText("Important")).toBeInTheDocument();
    expect(screen.getByText("Keep this in mind.")).toBeInTheDocument();
  });

  it("renders title-only and body-only callouts", () => {
    const { rerender } = render(
      <RichTextContent value={callout("Important", null)} />,
    );
    expect(screen.getByText("Important")).toBeInTheDocument();

    rerender(<RichTextContent value={callout(null, "Keep this in mind.")} />);
    expect(screen.getByText("Keep this in mind.")).toBeInTheDocument();
  });

  it("skips empty callouts", () => {
    const { container } = render(<RichTextContent value={callout(" ", " ")} />);

    expect(container.querySelector("aside")).not.toBeInTheDocument();
  });
});
