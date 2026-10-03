"use client";

import { Accordion } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { filterFaqHub, type FaqHubItem } from "@/lib/faq-hub-filter";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { type ReactNode, useId, useMemo, useState } from "react";
import styles from "./faq-hub.module.css";
import { FaqAccordionItem, faqRuleClass } from "./faq-item";

export type FaqHubBrowserItem = FaqHubItem & {
  /** The answer already rendered on the server. */
  answer: ReactNode;
  /** The question as fetched, stega metadata intact, so Presentation
      overlays can map a click on it back to the FAQ document. */
  title: string;
};

/*
 * The interactive half of the FAQ hub. Holds the chosen category and the
 * search text, runs the pure filter, and lays out the result: search field
 * first (full width), then the category list beside the grouped accordions.
 * Category controls are pill buttons (the one shape that means "press me")
 * with aria-pressed; the result count is a live region so a screen reader
 * hears it change.
 */
export default function FaqHubBrowser({
  cream,
  emptyState,
  emptyStateDataSanity,
  items,
  searchPlaceholder,
  sectionKey,
}: Readonly<{
  cream: boolean;
  emptyState: string;
  emptyStateDataSanity?: string;
  items: FaqHubBrowserItem[];
  searchPlaceholder: string;
  sectionKey: string;
}>) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const searchId = useId();
  // The chosen category may have vanished from the data (unpublished while
  // the page was open); resolve it once, so the filter and the buttons agree.
  const active =
    categoryId !== null && items.some((item) => item.category._id === categoryId)
      ? categoryId
      : null;
  const result = useMemo(() => filterFaqHub(items, active, search), [items, active, search]);
  const searching = search.trim().length > 0;
  const matching = Object.values(result.counts).reduce((sum, count) => sum + count, 0);
  const activeCategory =
    active === null ? null : result.categories.find((category) => category._id === active);

  const pool = active === null ? items.length : countIn(items, active);
  const status = !searching
    ? active === null
      ? `${items.length} questions`
      : `${result.total} ${result.total === 1 ? "question" : "questions"} in ${activeCategory?.title ?? "this topic"}`
    : result.total === 0
      ? "No questions match"
      : `${result.total} of ${pool} ${result.total === 1 ? "question matches" : "questions match"}`;

  const muted = "text-muted-foreground";
  const accent = "text-link";
  const rule = faqRuleClass(cream);
  // Category pills follow the site's other selectors: the chosen one fills
  // with the field's accent (link colour on light, highlight on dark), the
  // rest are hairline pills whose border turns to that accent on hover.
  const pillBase = cn(
    "focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-pill border px-4 py-2 text-[15px] font-semibold leading-none transition-[background-color,border-color,color,transform] motion-base motion-reduce:transition-none lg:w-full lg:justify-between",
    styles.pill,
  );
  const pillRest = cream
    ? "border-foreground/14 text-foreground hover:border-link"
    : "border-foreground/22 text-foreground hover:border-link";
  const pillPressed = "border-link bg-link text-link-foreground";

  return (
    <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[minmax(0,0.34fr)_minmax(0,1fr)] lg:gap-x-16 lg:gap-y-10 xl:gap-x-24">
      <div className={cn("lg:col-span-2", styles.reveal)}>
        <label className="text-label font-semibold" htmlFor={searchId}>
          Search the questions
        </label>
        <div className="relative mt-3 max-w-[40rem]">
          <Search
            aria-hidden="true"
            className={cn("pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2", accent)}
          />
          <Input
            autoComplete="off"
            className={cn(
              "pl-12 pr-4",
              "border-input text-foreground",
              cream
                ? "bg-white/70 placeholder:text-muted-foreground/80"
                : "bg-foreground/8 placeholder:text-foreground/55",
            )}
            enterKeyHint="search"
            id={searchId}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            type="search"
            value={search}
          />
        </div>
        <p aria-live="polite" className={cn("mt-3 text-[15px]", muted)} role="status">
          {status}
        </p>
      </div>

      <nav aria-label="FAQ categories" className={cn("min-w-0", styles.categories)}>
        <ul className={cn("m-0 flex list-none gap-2 overflow-x-auto p-0 lg:flex-col lg:overflow-visible", styles.track)}>
          <li className="shrink-0">
            <button
              aria-pressed={active === null}
              className={cn(pillBase, active === null ? pillPressed : pillRest)}
              onClick={() => setCategoryId(null)}
              type="button"
            >
              All
              <span className="tabular-nums opacity-70">{matching}</span>
            </button>
          </li>
          {result.categories.map((category) => {
            const pressed = active === category._id;
            return (
              <li className="shrink-0" key={category._id}>
                <button
                  aria-pressed={pressed}
                  className={cn(pillBase, pressed ? pillPressed : pillRest)}
                  onClick={() => setCategoryId(pressed ? null : category._id)}
                  type="button"
                >
                  {category.title}
                  <span className="tabular-nums opacity-70">{result.counts[category._id] ?? 0}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={cn("min-w-0", styles.reveal)}>
        {result.groups.length ? (
          <div className="grid gap-12 lg:gap-14">
            {result.groups.map((group) => {
              const headingId = `faq-hub-${sectionKey}-${group.category._id}`;
              return (
                <section aria-labelledby={headingId} className="scroll-mt-32" key={group.category._id}>
                  <div className={cn("relative flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b pb-4", rule)}>
                    {/* A short amber tick on the rule: the map-legend mark
                        that opens each topic. */}
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-px left-0 h-[3px] w-12 rounded-xs bg-mark"
                    />
                    <h3 className="font-display text-title-lg" id={headingId}>
                      {group.category.title}
                    </h3>
                    <p className={cn("text-label font-semibold", muted)}>
                      {group.faqs.length} {group.faqs.length === 1 ? "question" : "questions"}
                    </p>
                  </div>
                  {/* Every question starts closed: with eleven topics on one
                      page, one open answer per topic read as "everything is
                      open" (Ovi, 2026-09-25). */}
                  <Accordion className="w-full" collapsible type="single">
                    {group.faqs.map((faq) => (
                      <FaqAccordionItem compact cream={cream} key={faq._id} question={faq.title} value={faq._id}>
                        {faq.answer}
                      </FaqAccordionItem>
                    ))}
                  </Accordion>
                </section>
              );
            })}
          </div>
        ) : (
          <div className={cn("border-t py-10", rule)}>
            <p
              className="text-balance font-display text-title"
              data-sanity={emptyStateDataSanity}
            >
              {emptyState}
            </p>

          </div>
        )}
      </div>
    </div>
  );
}

function countIn(items: readonly FaqHubItem[], categoryId: string) {
  let count = 0;
  for (const item of items) if (item.category._id === categoryId) count += 1;
  return count;
}
