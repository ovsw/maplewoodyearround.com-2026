/*
 * Filters for the Filterable cards section (the Summer Camp activities).
 *
 * Pure: the same cards and filters always give the same cards, in their
 * page order. As on the live Finsweet filter, the choices inside one filter
 * widen the result (any chosen category) and the filters narrow each other
 * (a chosen category and a chosen grade). Every typed word must appear in
 * the card's name or text, compared without case or diacritics.
 *
 * The filters live in the URL query, one repeated key per choice, so a
 * filtered view can be shared: ?category=sports-fitness&grade=1st-grade.
 */

import { normalizeSearchText } from "./faq-hub-filter";

export type CardFilters = {
  /** Chosen category slugs. */
  categories: string[];
  /** Chosen grade slugs. */
  grades: string[];
  /** The typed search text, as typed. */
  search: string;
};

export type FilterableCard = {
  _id: string;
  /** The card's category slugs. */
  categories: string[];
  /** The card's grade slugs. */
  grades: string[];
  /** The card's name and text, plain. */
  text: string;
};

export const filterParams = {
  categories: "category",
  grades: "grade",
  search: "search",
} as const;

export const noFilters: CardFilters = { categories: [], grades: [], search: "" };

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function readCardFilters(params: URLSearchParams): CardFilters {
  return {
    categories: unique(params.getAll(filterParams.categories)),
    grades: unique(params.getAll(filterParams.grades)),
    search: params.get(filterParams.search) ?? "",
  };
}

/** The query for these filters. Other query keys are kept. */
export function writeCardFilters(params: URLSearchParams, filters: CardFilters): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of Object.values(filterParams)) next.delete(key);
  for (const slug of filters.categories) next.append(filterParams.categories, slug);
  for (const slug of filters.grades) next.append(filterParams.grades, slug);
  if (filters.search.trim()) next.set(filterParams.search, filters.search);
  return next;
}

export function hasCardFilters(filters: CardFilters) {
  return Boolean(filters.categories.length || filters.grades.length || filters.search.trim());
}

export function filterCards<T extends FilterableCard>(cards: readonly T[], filters: CardFilters): T[] {
  const words = normalizeSearchText(filters.search).split(/\s+/).filter(Boolean);
  const anyOf = (chosen: string[], values: string[]) =>
    !chosen.length || values.some((value) => chosen.includes(value));
  return cards.filter((card) => {
    if (!anyOf(filters.categories, card.categories) || !anyOf(filters.grades, card.grades)) {
      return false;
    }
    if (!words.length) return true;
    const haystack = normalizeSearchText(card.text);
    return words.every((word) => haystack.includes(word));
  });
}
