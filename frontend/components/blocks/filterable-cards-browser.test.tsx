import { noFilters, type CardFilters } from "@/lib/filterable-cards-filter";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterableCardsView } from "./filterable-cards-browser";

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
