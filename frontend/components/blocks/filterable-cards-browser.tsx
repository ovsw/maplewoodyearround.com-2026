"use client";

import {
  filterCards,
  readCardFilters,
  writeCardFilters,
  type CardFilters,
  type FilterableCard,
} from "@/lib/filterable-cards-filter";
import { ChevronDown, ListFilter, Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import styles from "./filterable-cards.module.css";

export type FilterOption = { slug: string; title: string };

export type FilterableCardsBrowserCard = FilterableCard & {
  /** The card already rendered on the server. */
  node: ReactNode;
};

type ViewProps = {
  cards: FilterableCardsBrowserCard[];
  categories: FilterOption[];
  emptyState: string;
  emptyStateDataSanity?: string;
  grades: FilterOption[];
  intro?: ReactNode;
  searchPlaceholder: string;
};

/*
 * The interactive half of the Filterable cards section: it reads the
 * filters from the URL query and writes every change back with
 * history.replaceState, which Next.js syncs with useSearchParams. Sharing
 * the address shares the filtered view.
 */
export default function FilterableCardsBrowser(props: ViewProps) {
  const params = useSearchParams();
  const filters = readCardFilters(new URLSearchParams(params.toString()));
  const onChange = (next: CardFilters) => {
    const query = writeCardFilters(new URLSearchParams(window.location.search), next).toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  };
  return <FilterableCardsView {...props} filters={filters} onChange={onChange} />;
}

/*
 * The section body without the URL: the server renders it with no filters
 * as the Suspense fallback, so every card is in the page's first HTML.
 */
export function FilterableCardsView({
  cards,
  categories,
  emptyState,
  emptyStateDataSanity,
  filters,
  grades,
  intro,
  onChange,
  searchPlaceholder,
}: ViewProps & { filters: CardFilters; onChange?: (filters: CardFilters) => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  // Choices that are not options any more (an old shared link) do not filter.
  const known = (chosen: string[], options: FilterOption[]) =>
    chosen.filter((slug) => options.some((option) => option.slug === slug));
  const active: CardFilters = {
    categories: known(filters.categories, categories),
    grades: known(filters.grades, grades),
    search: filters.search,
  };
  const visible = filterCards(cards, active);
  const change = (next: Partial<CardFilters>) => onChange?.({ ...active, ...next });
  const titleOf = (options: FilterOption[], slug: string) =>
    options.find((option) => option.slug === slug)?.title ?? slug;

  const form = (idPrefix: string) => (
    <FilterForm
      categories={categories}
      change={change}
      filters={active}
      grades={grades}
      idPrefix={idPrefix}
      searchPlaceholder={searchPlaceholder}
    />
  );

  return (
    <>
      <div className={styles.header}>
        {intro}
        <DialogPrimitive.Root onOpenChange={setDialogOpen} open={dialogOpen}>
          <DialogPrimitive.Trigger className={styles.filtersButton}>
            <ListFilter aria-hidden size={20} />
            Filters
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className={styles.overlay} />
            <DialogPrimitive.Content aria-describedby={undefined} className={styles.dialog}>
              <DialogPrimitive.Title className={styles.dialogTitle}>Filters</DialogPrimitive.Title>
              {form("dialog")}
              <p aria-live="polite" className={styles.count} role="status">
                Showing {visible.length} of {cards.length}
              </p>
              <DialogPrimitive.Close aria-label="Close filters" className={styles.close}>
                <X aria-hidden size={28} />
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>

      <div className={styles.inline}>{form("inline")}</div>

      <div className={styles.status}>
        {active.categories.length || active.grades.length || active.search.trim() ? (
          <ul aria-label="Chosen filters" className={styles.tags}>
            {active.categories.map((slug) => (
              <li key={`category-${slug}`}>
                <button
                  aria-label={`Remove filter: ${titleOf(categories, slug)}`}
                  className={styles.tag}
                  onClick={() => change({ categories: active.categories.filter((item) => item !== slug) })}
                  type="button"
                >
                  {titleOf(categories, slug)}
                  <X aria-hidden size={18} />
                </button>
              </li>
            ))}
            {active.grades.map((slug) => (
              <li key={`grade-${slug}`}>
                <button
                  aria-label={`Remove filter: ${titleOf(grades, slug)}`}
                  className={styles.tag}
                  onClick={() => change({ grades: active.grades.filter((item) => item !== slug) })}
                  type="button"
                >
                  {titleOf(grades, slug)}
                  <X aria-hidden size={18} />
                </button>
              </li>
            ))}
            {active.search.trim() ? (
              <li>
                <button
                  aria-label={`Remove search: ${active.search.trim()}`}
                  className={styles.tag}
                  onClick={() => change({ search: "" })}
                  type="button"
                >
                  {active.search.trim()}
                  <X aria-hidden size={18} />
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
        <p aria-live="polite" className={styles.count} role="status">
          Showing {visible.length} of {cards.length}
        </p>
      </div>

      {visible.length ? (
        <ul className={styles.list}>
          {visible.map((card) => (
            <li key={card._id}>{card.node}</li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty} data-sanity={emptyStateDataSanity}>
          {emptyState}
        </p>
      )}
    </>
  );
}

function FilterForm({
  categories,
  change,
  filters,
  grades,
  idPrefix,
  searchPlaceholder,
}: {
  categories: FilterOption[];
  change: (next: Partial<CardFilters>) => void;
  filters: CardFilters;
  grades: FilterOption[];
  idPrefix: string;
  searchPlaceholder: string;
}) {
  const searchId = useId();
  return (
    <form
      className={styles.groups}
      onSubmit={(event) => event.preventDefault()}
      role="search"
    >
      <MultiSelect
        chosen={filters.categories}
        id={`${idPrefix}-category`}
        label="By Category"
        onChange={(next) => change({ categories: next })}
        options={categories}
      />
      <MultiSelect
        chosen={filters.grades}
        id={`${idPrefix}-grade`}
        label="By Age"
        onChange={(next) => change({ grades: next })}
        options={grades}
      />
      <div className={styles.group}>
        <div className={styles.groupLabel}>
          <label htmlFor={searchId}>Search</label>
          {filters.search ? (
            <button className={styles.clear} onClick={() => change({ search: "" })} type="button">
              Clear<span className="sr-only"> search</span>
            </button>
          ) : null}
        </div>
        <div className={styles.search}>
          <Search aria-hidden className={styles.searchIcon} size={20} />
          <input
            autoComplete="off"
            className={styles.searchInput}
            enterKeyHint="search"
            id={searchId}
            maxLength={256}
            onChange={(event) => change({ search: event.target.value })}
            placeholder={searchPlaceholder}
            type="search"
            value={filters.search}
          />
        </div>
      </div>
    </form>
  );
}

/*
 * The live "select" dropdown: a button that shows and hides a list of
 * checkboxes (a disclosure, so each checkbox keeps its native keyboard
 * use). Escape closes it and returns focus to the button; so does moving
 * focus or clicking outside it.
 */
function MultiSelect({
  chosen,
  id,
  label,
  onChange,
  options,
}: {
  chosen: string[];
  id: string;
  label: string;
  onChange: (next: string[]) => void;
  options: FilterOption[];
}) {
  const [open, setOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // Safari does not focus a clicked button, so a click outside may not blur.
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!groupRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const labelId = `${id}-label`;
  const panelId = `${id}-panel`;
  const summary =
    chosen.length === 0
      ? "select"
      : chosen.length === 1
        ? (options.find((option) => option.slug === chosen[0])?.title ?? "1 selected")
        : `${chosen.length} selected`;
  return (
    <div
      className={styles.group}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
          toggleRef.current?.focus();
        }
      }}
      ref={groupRef}
      role="group"
      aria-labelledby={labelId}
    >
      <div className={styles.groupLabel}>
        <span id={labelId}>{label}</span>
        {chosen.length ? (
          <button className={styles.clear} onClick={() => onChange([])} type="button">
            Clear<span className="sr-only"> {label}</span>
          </button>
        ) : null}
      </div>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={`${label}: ${summary}`}
        className={styles.toggle}
        onClick={() => setOpen((value) => !value)}
        ref={toggleRef}
        type="button"
      >
        <span>{summary}</span>
        <ChevronDown aria-hidden className={styles.chevron} size={20} />
      </button>
      <div className={styles.panel} hidden={!open} id={panelId}>
        {options.map((option) => (
          <label className={styles.option} key={option.slug}>
            <input
              checked={chosen.includes(option.slug)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...chosen, option.slug]
                    : chosen.filter((slug) => slug !== option.slug),
                )
              }
              type="checkbox"
              value={option.slug}
            />
            {option.title}
          </label>
        ))}
      </div>
    </div>
  );
}
