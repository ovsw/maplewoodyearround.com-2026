import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import StackedTimeline from "./stacked-timeline";

type TimelineItem = NonNullable<
  ComponentProps<typeof StackedTimeline>["items"]
>[number];

const imageAsset = {
  _id: "image-bus-1200x800-jpg",
  url: "https://cdn.sanity.io/images/test-project/test/bus-1200x800.jpg",
  mimeType: "image/jpeg",
  metadata: { lqip: null, dimensions: { width: 1200, height: 800 } },
};

function item(
  key: string,
  title: string,
  overrides: Partial<TimelineItem> = {},
): TimelineItem {
  return {
    _key: key,
    title,
    meta: null,
    text: `${title} in one line.`,
    image: null,
    ...overrides,
  };
}

const items: TimelineItem[] = [
  item("yorkdale", "Yorkdale", {
    meta: "10:00 am",
    image: {
      _type: "image",
      alt: "Campers boarding the camp bus",
      asset: imageAsset,
    } as TimelineItem["image"],
  }),
  item("huntsville", "Huntsville", { meta: "12:15 pm" }),
  item("manito-landing", "Manito Landing"),
  item("water-taxi", "Water taxi"),
  item("island", "Example location"),
];

const block: ComponentProps<typeof StackedTimeline> = {
  _key: "trip",
  _type: "stackedTimeline",
  background: "green",
  eyebrow: "Getting there",
  title: [
    {
      _key: "heading",
      _type: "block",
      style: "normal",
      markDefs: null,
      children: [
        { _key: "plain", _type: "span", marks: [], text: "Toronto to the " },
        { _key: "accent", _type: "span", marks: ["em"], text: "island" },
      ],
    },
  ],
  intro: "One bus, one boat, camp staff the whole way.",
  buttons: [
    {
      _key: "ask",
      _type: "button",
      text: "Ask about the trip",
      variant: "default",
      openInNewTab: false,
      href: "/contact",
    },
    {
      _key: "unsafe",
      _type: "button",
      text: "Unsafe",
      variant: "outline",
      openInNewTab: false,
      href: "javascript:alert(1)",
    },
  ],
  items,
  dataAttribute: (path) => `section:${path}`,
};

const itemTitles = items.map((entry) => entry.title);

function getItems() {
  const list = screen.getByRole("list", { name: "Cards, in order" });
  return within(list).getAllByRole("listitem");
}

describe("StackedTimeline", () => {
  it("renders one ordered list so both layouts read the same order", () => {
    render(<StackedTimeline {...block} />);

    const lists = screen.getAllByRole("list", { name: "Cards, in order" });
    expect(lists).toHaveLength(1);
    expect(lists[0].tagName).toBe("OL");

    const rendered = getItems().map(
      (entry) => within(entry).getByRole("heading", { level: 3 }).textContent,
    );
    expect(rendered).toEqual(itemTitles);
    expect(getItems().map((entry) => entry.dataset.timelineItem)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
    ]);
  });

  it("moves keyboard focus through the intro button, then the cards in order", async () => {
    const user = userEvent.setup();
    render(<StackedTimeline {...block} />);

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("link", { name: "Ask about the trip" }),
    );

    const cards = getItems();
    const focused: string[] = [];
    for (let index = 0; index < cards.length; index += 1) {
      await user.tab();
      expect(document.activeElement).toBe(cards[index]);
      focused.push(
        within(document.activeElement as HTMLElement).getByRole("heading", {
          level: 3,
        }).textContent ?? "",
      );
    }
    expect(focused).toEqual(itemTitles);

    await user.tab();
    expect(getItems()).not.toContain(document.activeElement);
  });

  it("drops unsafe button hrefs", () => {
    render(<StackedTimeline {...block} />);

    expect(screen.getByRole("link", { name: "Ask about the trip" })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(screen.queryByRole("link", { name: "Unsafe" })).toBeNull();
  });

  it("labels each card, shows the meta when given, and keeps editing paths keyed", () => {
    render(<StackedTimeline {...block} />);

    const cards = getItems();
    const first = cards[0];
    expect(first).toHaveAccessibleName("Yorkdale");
    expect(first).toHaveAccessibleDescription("Yorkdale in one line.");
    expect(within(first).getByText("10:00 am")).toHaveAttribute(
      "data-sanity",
      'section:items[_key=="yorkdale"].meta',
    );
    expect(within(first).getByRole("img")).toHaveAttribute(
      "alt",
      "Campers boarding the camp bus",
    );

    const manito = cards[2];
    expect(within(manito).queryByRole("img")).toBeNull();
    expect(
      manito.querySelector('[data-sanity="section:items[_key==\\"manito-landing\\"].image"]'),
    ).toHaveAttribute("aria-hidden", "true");

  });

  it("drops cards missing a title or line and renders nothing below two cards", () => {
    const { unmount } = render(
      <StackedTimeline
        {...block}
        items={[...items, item("blank", "   "), item("no-line", "No line", { text: "" })]}
      />,
    );
    expect(getItems()).toHaveLength(5);
    unmount();

    const { container } = render(<StackedTimeline {...block} items={[items[0]]} />);
    expect(container.querySelector("section")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });
});
