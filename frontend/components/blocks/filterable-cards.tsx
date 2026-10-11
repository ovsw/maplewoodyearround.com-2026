import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { noFilters } from "@/lib/filterable-cards-filter";
import { stegaClean } from "next-sanity";
import { Suspense } from "react";
import FilterableCardsBrowser, {
  FilterableCardsView,
  type FilterableCardsBrowserCard,
  type FilterOption,
} from "./filterable-cards-browser";
import styles from "./filterable-cards.module.css";
import { innerCss as css, SourceImage } from "./maplewood-inner";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type FilterableCardsProps = Extract<PageBlock, { _type: "filterableCards" }> & {
  dataAttribute?: (path: string) => string | undefined;
  itemDataAttribute?: (documentId: string, documentType: string, path: string) => string | undefined;
};

type Item = NonNullable<FilterableCardsProps["items"]>[number];
type Term = { _id: string; title: string | null; slug: { current?: string | null } | null; order?: number | null };

const backgrounds = { cream: css.cream, green: css.green, white: css.white } as const;

function slugOf(term: Term) {
  return stegaClean(term.slug?.current)?.trim() || term._id;
}

/** Every term the cards use, once, in editor order and then by name. */
function optionsFrom(terms: Term[]): FilterOption[] {
  const byId = new Map<string, Term>();
  for (const term of terms) byId.set(term._id, term);
  return [...byId.values()]
    .sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
        (stegaClean(a.title) ?? "").localeCompare(stegaClean(b.title) ?? ""),
    )
    .map((term) => ({ slug: slugOf(term), title: stegaClean(term.title)?.trim() || slugOf(term) }));
}

function termsOf(item: Item): { categories: Term[]; grades: Term[] } {
  return {
    categories: [item.category, ...(item.categories ?? [])].flatMap((term) => (term ? [term] : [])),
    grades: (item.grades ?? []).flatMap((term) => (term ? [term] : [])),
  };
}

/*
 * Filterable cards — a collection as a card grid with keyword search. The
 * Summer activities also have the live page's category and grade filters.
 * The other collections have search only until Maplewood chooses their
 * filters: the live School Year facilities filters had no real data (#77).
 *
 * The live section has no visible heading, so the heading is for screen
 * readers only. The intro shows on phones and tablets, beside the Filters
 * button, as live. Cards render here on the server; the browser only
 * filters them.
 */
export default function FilterableCards({
  _key,
  background,
  dataAttribute,
  description,
  emptyState,
  itemDataAttribute,
  items,
  searchPlaceholder,
  source,
  title,
}: FilterableCardsProps) {
  const visibleItems = (items ?? []).filter((item) => stegaClean(item.title)?.trim());
  // The heading is for screen readers only, so a missing title must not hide the cards.
  if (!visibleItems.length) return null;
  const hasDropdowns = stegaClean(source) === "summerActivity";

  const sectionKey = stegaClean(_key);
  const headingId = `filterable-cards-${sectionKey}-title`;
  const edit = (item: Item, path: string) => itemDataAttribute?.(item._id, item._type, path);

  const cards: FilterableCardsBrowserCard[] = visibleItems.map((item) => {
    const terms = termsOf(item);
    return {
      _id: item._id,
      categories: terms.categories.map(slugOf),
      grades: terms.grades.map(slugOf),
      text: `${stegaClean(item.title) ?? ""} ${stegaClean(item.description) ?? ""}`,
      node: (
        <>
          <div className={styles.imageFrame} data-sanity={edit(item, "image")}>
            <SourceImage image={item.image} sizes="(max-width: 767px) 90vw, (max-width: 991px) 45vw, 18rem" width={640} />
          </div>
          <div className={styles.cardText}>
            <h3 className={styles.cardTitle} data-sanity={edit(item, "title")}>
              {item.title}
            </h3>
            {item.description ? (
              <p className={styles.cardDescription} data-sanity={edit(item, "description")}>
                {item.description}
              </p>
            ) : null}
          </div>
        </>
      ),
    };
  });

  const view = {
    cards,
    categories: hasDropdowns ? optionsFrom(visibleItems.flatMap((item) => termsOf(item).categories)) : [],
    emptyState: stegaClean(emptyState)?.trim() || "No activities match these filters.",
    emptyStateDataSanity: dataAttribute?.("emptyState"),
    grades: hasDropdowns ? optionsFrom(visibleItems.flatMap((item) => termsOf(item).grades)) : [],
    intro: stegaClean(description)?.trim() ? (
      <p className={styles.intro} data-sanity={dataAttribute?.("description")}>
        {description}
      </p>
    ) : undefined,
    searchPlaceholder: stegaClean(searchPlaceholder)?.trim() || "Keyword",
  };

  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, backgrounds[stegaClean(background) as keyof typeof backgrounds] ?? css.cream].join(" ")}
      id={`filterable-cards-${sectionKey}`}
    >
      <div className={css.container}>
        <h2 className="sr-only" data-sanity={dataAttribute?.("title")} id={headingId}>
          {title || "Filters"}
        </h2>
        <Suspense fallback={<FilterableCardsView {...view} filters={noFilters} />}>
          <FilterableCardsBrowser {...view} />
        </Suspense>
      </div>
    </section>
  );
}
