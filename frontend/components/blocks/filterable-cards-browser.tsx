"use client";

import {
  filterCards,
  readCardFilters,
  writeCardFilters,
  type CardFilters,
  type FilterableCard,
} from "@/lib/filterable-cards-filter";
import { ChevronDown, ListFilter, Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { useSearchParams } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import styles from "./filterable-cards.module.css";

/*
 * Motion. A filter change re-sorts the grid: the cards that stay glide to
 * their new slot, the cards that leave shrink away first, and the arrivals
 * rise in behind them, one after the other. The same spring moves the chosen
 * filter tags, so the controls and the cards read as one system. With
 * reduced motion, nothing moves: states still fade so a change stays visible.
 */
const glide: Transition = { damping: 32, mass: 0.7, stiffness: 300, type: "spring" };
const arrive = { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const };
const leave = { duration: 0.16, ease: [0.4, 0, 1, 1] as const };
const fade = { duration: 0.15 };

function useMotionTokens() {
  const reduced = useReducedMotion();
  return {
    reduced,
    /**
     * Props for the n-th item of an animated list. The layout FLIP moves the
     * position only: an item never changes size, so nothing distorts. The
     * entrance stagger caps so a long list never waits.
     */
    item: (index = 0) => ({
      layout: reduced ? false : ("position" as const),
      initial: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: reduced ? { opacity: 0, transition: fade } : { opacity: 0, scale: 0.94, transition: leave },
      transition: {
        ...(reduced ? fade : arrive),
        delay: reduced ? 0 : Math.min(index * 0.03, 0.24),
        layout: reduced ? { duration: 0 } : glide,
      },
    }),
  };
}

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
  const m = useMotionTokens();
  const tags = [
    ...active.categories.map((slug) => ({
      ariaLabel: `Remove filter: ${titleOf(categories, slug)}`,
      key: `category-${slug}`,
      remove: () => change({ categories: active.categories.filter((item) => item !== slug) }),
      title: titleOf(categories, slug),
    })),
    ...active.grades.map((slug) => ({
      ariaLabel: `Remove filter: ${titleOf(grades, slug)}`,
      key: `grade-${slug}`,
      remove: () => change({ grades: active.grades.filter((item) => item !== slug) }),
      title: titleOf(grades, slug),
    })),
    ...(active.search.trim()
      ? [
          {
            ariaLabel: `Remove search: ${active.search.trim()}`,
            key: "search",
            remove: () => change({ search: "" }),
            title: active.search.trim(),
          },
        ]
      : []),
  ];

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
              <Count shown={visible.length} total={cards.length} />
              <DialogPrimitive.Close aria-label="Close filters" className={styles.close}>
                <X aria-hidden size={28} />
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>

      <div className={styles.inline}>{form("inline")}</div>

      <div className={styles.status}>
        {/* The list stays mounted so a removed tag can leave before the list empties. */}
        <ul aria-label="Chosen filters" className={styles.tags}>
          <AnimatePresence initial={false} mode="popLayout">
            {tags.map((tag) => (
              <motion.li key={tag.key} {...m.item()}>
                <button aria-label={tag.ariaLabel} className={styles.tag} onClick={tag.remove} type="button">
                  {tag.title}
                  <X aria-hidden size={18} />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <Count shown={visible.length} total={cards.length} />
      </div>

      {/* The grid stays mounted so leaving cards can shrink away while the empty
          notice, when there is one, fades in beneath them. */}
      <ul className={styles.list}>
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((card, index) => (
            <motion.li key={card._id} {...m.item(index)}>
              {card.node}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <AnimatePresence initial={false}>
        {visible.length ? null : (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className={styles.empty}
            data-sanity={emptyStateDataSanity}
            exit={{ opacity: 0, transition: fade }}
            initial={m.reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            key="empty"
            transition={m.reduced ? fade : arrive}
          >
            {emptyState}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
}

/** "Showing 12 of 40": the number fades to its new value, so the eye catches the change. */
function Count({ shown, total }: { shown: number; total: number }) {
  return (
    <p aria-live="polite" className={styles.count} role="status">
      Showing{" "}
      <motion.span
        animate={{ opacity: 1 }}
        className={styles.countNumber}
        initial={{ opacity: 0 }}
        key={shown}
        transition={fade}
      >
        {shown}
      </motion.span>{" "}
      of {total}
    </p>
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
          <ClearButton onClick={() => change({ search: "" })} shown={Boolean(filters.search)}>
            Clear<span className="sr-only"> search</span>
          </ClearButton>
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
  const reduced = useReducedMotion();
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
        <ClearButton onClick={() => onChange([])} shown={chosen.length > 0}>
          Clear<span className="sr-only"> {label}</span>
        </ClearButton>
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
      {/* The list takes focus, so a press on an option's name keeps focus
          inside the dropdown. Without it, focus moves to <main> (the skip
          link target), the dropdown closes, and the click chooses nothing. */}
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={styles.panel}
            exit={{ opacity: 0, transition: fade, y: reduced ? 0 : -4 }}
            id={panelId}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            key="panel"
            tabIndex={-1}
            transition={reduced ? fade : { duration: 0.2, ease: arrive.ease }}
          >
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** The small "Clear" link beside a group label: it fades in with the first choice. */
function ClearButton({ children, onClick, shown }: { children: ReactNode; onClick: () => void; shown: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {shown ? (
        <motion.button
          animate={{ opacity: 1 }}
          className={styles.clear}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          key="clear"
          onClick={onClick}
          transition={fade}
          type="button"
        >
          {children}
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
