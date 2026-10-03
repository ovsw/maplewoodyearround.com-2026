import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NavigationIcon } from "./navigation-icon";

const landmarkSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M3 22h18"></path><path d="M6 18v-7"></path></svg>';

describe("NavigationIcon", () => {
  it("renders safe SVG markup stored with the document", () => {
    const { container } = render(
      <NavigationIcon
        icon={{ name: "landmark", svg: landmarkSvg }}
      />,
    );

    expect(container.querySelector("svg path")).toBeInTheDocument();
    expect(container.querySelector("span")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it.each([
    '<script>alert("nope")</script>',
    '<svg><script>alert("nope")</script></svg>',
    '<svg onload="alert(1)"><path d="M0 0" /></svg>',
  ])("omits unsafe stored markup: %s", (svg) => {
    const { container } = render(
      <NavigationIcon icon={{ name: "landmark", svg }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
