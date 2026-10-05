import { render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import StackedTimeline from "./stacked-timeline";

type TimelineItem = NonNullable<ComponentProps<typeof StackedTimeline>["items"]>[number];

function item(key: string, title: string, overrides: Partial<TimelineItem> = {}): TimelineItem {
  return { _key: key, title, meta: null, text: `${title} in one line.`, body: null, image: null, ...overrides };
}

const items: TimelineItem[] = [
  item("account", "Create an account", { meta: "Step 1" }),
  item("form", "Complete the form", { meta: "Step 2" }),
  item("review", "Application review", { meta: "Step 3" }),
];

const block: ComponentProps<typeof StackedTimeline> = {
  _key: "enroll",
  _type: "stackedTimeline",
  anchorId: "how-it-works",
  layout: "steps",
  background: "cream",
  eyebrow: "How to Enroll",
  title: [
    {
      _key: "heading",
      _type: "block",
      style: "normal",
      markDefs: null,
      children: [{ _key: "plain", _type: "span", marks: [], text: "Enrollment Process" }],
    },
  ],
  intro: "It's as easy as 1..2..3..4!",
  buttons: [
    { _key: "ask", _type: "button", text: "Get In Touch", variant: "outline", openInNewTab: false, href: "/contact" },
    { _key: "unsafe", _type: "button", text: "Unsafe", variant: "outline", openInNewTab: false, href: "javascript:alert(1)" },
  ],
  items,
  dataAttribute: (path) => `section:${path}`,
};

const steps = () => within(screen.getByRole("list", { name: "Steps, in order" })).getAllByRole("listitem");

describe("StackedTimeline", () => {
  it("renders the steps in order with their labels and keyed edit paths", () => {
    render(<StackedTimeline {...block} />);

    const rendered = steps();
    expect(rendered.map((step) => within(step).getByRole("heading", { level: 3 }).textContent)).toEqual(
      items.map((entry) => entry.title),
    );
    expect(within(rendered[0]).getByText("Step 1")).toHaveAttribute(
      "data-sanity",
      'section:items[_key=="account"].meta',
    );
    expect(screen.getByText("How to Enroll")).toBeInTheDocument();
  });

  it("drops unsafe button hrefs", () => {
    render(<StackedTimeline {...block} />);

    expect(screen.getByRole("link", { name: /Get In Touch/ })).toHaveAttribute("href", "/contact");
    expect(screen.queryByRole("link", { name: /Unsafe/ })).toBeNull();
  });

  it("drops steps missing a title or line and renders nothing below two steps", () => {
    const { unmount } = render(
      <StackedTimeline {...block} items={[...items, item("blank", "   "), item("no-line", "No line", { text: "" })]} />,
    );
    expect(steps()).toHaveLength(3);
    unmount();

    const { container } = render(<StackedTimeline {...block} items={[items[0]]} />);
    expect(container.querySelector("section")).toBeNull();
  });
});
