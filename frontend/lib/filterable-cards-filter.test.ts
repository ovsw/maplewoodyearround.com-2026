import { describe, expect, it } from "vitest";
import {
  filterCards,
  hasCardFilters,
  noFilters,
  readCardFilters,
  writeCardFilters,
  type FilterableCard,
} from "./filterable-cards-filter";

const cards: FilterableCard[] = [
  { _id: "archery", categories: ["fun-adventure"], grades: ["1st-grade", "2nd-grade"], text: "Archery Take aim...Ready...Fire!" },
  { _id: "arts", categories: ["creative-artistic"], grades: ["preschool", "1st-grade"], text: "Arts & Crafts Our two art studios" },
  { _id: "boating", categories: ["swimming-waterfront"], grades: ["5th-grade"], text: "Boating Our 5-acre lake" },
  { _id: "ceramics", categories: ["creative-artistic"], grades: ["5th-grade"], text: "Céramics Painting pottery" },
];

const ids = (result: FilterableCard[]) => result.map((card) => card._id);

describe("filterCards", () => {
  it("keeps every card in page order without filters", () => {
    expect(ids(filterCards(cards, noFilters))).toEqual(["archery", "arts", "boating", "ceramics"]);
  });

  it("widens within one filter and narrows across filters", () => {
    expect(ids(filterCards(cards, { ...noFilters, categories: ["creative-artistic", "swimming-waterfront"] })))
      .toEqual(["arts", "boating", "ceramics"]);
    expect(ids(filterCards(cards, { ...noFilters, categories: ["creative-artistic"], grades: ["5th-grade"] })))
      .toEqual(["ceramics"]);
  });

  it("needs every typed word in the name or text, without case or accents", () => {
    expect(ids(filterCards(cards, { ...noFilters, search: "  ceramics POTTERY " }))).toEqual(["ceramics"]);
    expect(ids(filterCards(cards, { ...noFilters, search: "lake" }))).toEqual(["boating"]);
    expect(filterCards(cards, { ...noFilters, search: "lacrosse" })).toEqual([]);
  });

  it("drops a card without grades when a grade is chosen", () => {
    const ungraded = [...cards, { _id: "dance", categories: [], grades: [], text: "Dance" }];
    expect(ids(filterCards(ungraded, { ...noFilters, grades: ["preschool"] }))).toEqual(["arts"]);
  });
});

describe("the URL query", () => {
  it("reads repeated keys, ignoring empty and repeated choices", () => {
    const params = new URLSearchParams("category=a&category=b&category=a&grade=&grade=k&search=swim");
    expect(readCardFilters(params)).toEqual({ categories: ["a", "b"], grades: ["k"], search: "swim" });
  });

  it("writes the filters, keeps other keys and leaves out empty search", () => {
    const written = writeCardFilters(new URLSearchParams("utm_source=mail&category=old"), {
      categories: ["fun-adventure"],
      grades: ["1st-grade", "2nd-grade"],
      search: "  ",
    });
    expect(written.toString()).toBe("utm_source=mail&category=fun-adventure&grade=1st-grade&grade=2nd-grade");
    expect(readCardFilters(written)).toEqual({ categories: ["fun-adventure"], grades: ["1st-grade", "2nd-grade"], search: "" });
  });

  it("knows when any filter is set", () => {
    expect(hasCardFilters(noFilters)).toBe(false);
    expect(hasCardFilters({ ...noFilters, search: " " })).toBe(false);
    expect(hasCardFilters({ ...noFilters, grades: ["k"] })).toBe(true);
  });
});
