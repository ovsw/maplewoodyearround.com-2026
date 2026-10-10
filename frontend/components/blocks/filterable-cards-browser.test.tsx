import { noFilters, type CardFilters } from "@/lib/filterable-cards-filter";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FilterableCardsBrowser, { FilterableCardsView } from "./filterable-cards-browser";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));

function renderView(onChange: (filters: CardFilters) => void) {
  // The site's <main> takes focus (the skip link target), so a press on
  // text inside the section moves focus to it, as on the real page.
  render(
    <main tabIndex={-1}>
    <FilterableCardsView
      cards={[{ _id: "dance", categories: ["arts"], grades: ["k"], text: "Dance", node: <h3>Dance</h3> }]}
      categories={[{ slug: "arts", title: "Creative & Artistic" }]}
      emptyState="No activities match these filters."
      filters={noFilters}
      grades={[{ slug: "k", title: "Kindergarten" }]}
      onChange={onChange}
      searchPlaceholder="Keyword"
    />
    </main>,
  );
}

describe("the By Age dropdown", () => {
  it("chooses an option when its name is clicked, not only its checkbox", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderView(onChange);

    // The inline form; the phone panel renders only when opened.
    const toggle = screen.getByRole("button", { name: /^By Age/ });
    await user.click(toggle);
    await user.click(screen.getByText("Kindergarten", { selector: "label" }));

    // A browser does not click an option the dropdown hid on press.
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    // The inline form animates the grid; only the phone sheet does not.
    expect(onChange).toHaveBeenCalledWith({ ...noFilters, grades: ["k"] }, { animate: true });
  });

  it("closes when focus moves to another control", async () => {
    const user = userEvent.setup();
    renderView(vi.fn());
    const toggle = screen.getByRole("button", { name: /^By Age/ });

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("searchbox"));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});

describe("a list without filter options", () => {
  it("shows only the search field, with no Filters panel", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterableCardsView
        cards={[{ _id: "lake", categories: [], grades: [], text: "Lake", node: <h3>Lake</h3> }]}
        categories={[]}
        emptyState="No facilities match this search."
        filters={noFilters}
        grades={[]}
        onChange={onChange}
        searchPlaceholder="Keyword"
      />,
    );

    expect(screen.queryByRole("button", { name: "Filters" })).toBeNull();
    expect(screen.queryByRole("group", { name: /^By / })).toBeNull();
    await user.type(screen.getByRole("searchbox"), "l");
    expect(onChange).toHaveBeenCalledWith({ ...noFilters, search: "l" }, { animate: true });
  });
});

describe("the search field", () => {
  it("keeps every letter typed before the cards' animation runs", async () => {
    // The browser runs a view transition's update a frame later; hold them all.
    const pending: (() => void)[] = [];
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: (update: () => void) => {
        pending.push(update);
      },
    });
    try {
      const user = userEvent.setup();
      render(
        <FilterableCardsBrowser
          cards={[
            { _id: "lake", categories: [], grades: [], text: "Lake", node: <h3>Lake</h3> },
            { _id: "lobby", categories: [], grades: [], text: "Lobby", node: <h3>Lobby</h3> },
          ]}
          categories={[]}
          emptyState="No facilities match this search."
          grades={[]}
          searchPlaceholder="Keyword"
        />,
      );

      await user.type(screen.getByRole("searchbox"), "lake");
      expect(screen.getByRole("searchbox")).toHaveValue("lake");
      expect(screen.getByRole("status")).toHaveTextContent("Showing 2 of 2");

      act(() => pending.forEach((update) => update()));
      expect(screen.getByRole("status")).toHaveTextContent("Showing 1 of 2");
      expect(window.location.search).toBe("?search=lake");
    } finally {
      Reflect.deleteProperty(document, "startViewTransition");
    }
  });
});
