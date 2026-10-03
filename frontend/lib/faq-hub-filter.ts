/*
 * Filter-and-group for the FAQ hub.
 *
 * Pure: the same FAQs, category, and search text always give the same
 * groups. The input list is already in page order (category order, then FAQ
 * order, then question), so grouping keeps first-seen order and never
 * re-sorts. Text is compared without case or diacritics, and every typed
 * word must appear in the question or the plain-text answer.
 */

export type FaqHubCategory = {
  _id: string;
  title: string | null;
  slug: string | null;
  order: number | null;
};

export type FaqHubItem = {
  _id: string;
  category: FaqHubCategory;
  /** The question, already stripped of stega characters. */
  question: string;
  /** The answer flattened to plain text once by the query. */
  answerText: string;
};

export type FaqHubGroup<T extends FaqHubItem> = {
  category: FaqHubCategory;
  faqs: T[];
};

export type FaqHubResult<T extends FaqHubItem> = {
  /** Every category present in the input, in page order, whatever the filter. */
  categories: FaqHubCategory[];
  /** Categories with at least one visible FAQ, in page order. */
  groups: FaqHubGroup<T>[];
  /** FAQs matching the search in each category, whatever category is chosen. */
  counts: Record<string, number>;
  /** FAQs visible after both the category and the search apply. */
  total: number;
};

export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .trim();
}

function searchWords(search: string): string[] {
  return normalizeSearchText(search).split(/\s+/).filter(Boolean);
}

export function filterFaqHub<T extends FaqHubItem>(
  faqs: readonly T[],
  categoryId: string | null,
  search: string,
): FaqHubResult<T> {
  const words = searchWords(search);
  const matches = (faq: T) => {
    if (!words.length) return true;
    const haystack = normalizeSearchText(`${faq.question} ${faq.answerText}`);
    return words.every((word) => haystack.includes(word));
  };

  const categories: FaqHubCategory[] = [];
  const counts: Record<string, number> = {};
  const groups = new Map<string, FaqHubGroup<T>>();
  let total = 0;

  for (const faq of faqs) {
    const id = faq.category._id;
    if (!(id in counts)) {
      counts[id] = 0;
      categories.push(faq.category);
    }
    if (!matches(faq)) continue;
    counts[id] += 1;
    if (categoryId !== null && categoryId !== id) continue;

    let group = groups.get(id);
    if (!group) {
      group = { category: faq.category, faqs: [] };
      groups.set(id, group);
    }
    group.faqs.push(faq);
    total += 1;
  }

  return { categories, groups: [...groups.values()], counts, total };
}
