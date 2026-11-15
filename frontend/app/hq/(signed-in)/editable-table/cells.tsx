"use client";

// The cells of the Camp HQ editable table: each saves by itself, shows a small
// "Saved" mark, and on a refusal shows the reason and goes back to its old value.
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { CellResult, EditableOption } from "./types";

const SAVE_FAILED = "Camp HQ could not save this. Check the connection and try again.";

type CellStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "refused"; error: string; link?: { href: string; label: string } };

/** Runs a save and turns anything thrown into a refusal. */
export async function attempt(save: () => Promise<CellResult>): Promise<CellResult> {
  try {
    return await save();
  } catch {
    return { ok: false, error: SAVE_FAILED };
  }
}

/**
 * One cell's value while it saves. The new value shows at once, on top of the
 * stored value it replaced; a refusal drops it, so the cell shows the stored
 * value again.
 */
function useCellSave<Value>(value: Value, save: (next: Value) => Promise<CellResult>) {
  const [pending, setPending] = useState<{ value: Value; over: Value } | null>(null);
  const [status, setStatus] = useState<CellStatus>({ kind: "idle" });
  const latest = useRef(0);

  useEffect(() => {
    if (status.kind !== "saved") return;
    const timer = setTimeout(() => setStatus({ kind: "idle" }), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  // The stored value moved on: the pending value was confirmed or replaced, so
  // drop it. It must not come back if the stored value returns to the old one.
  if (pending && !Object.is(pending.over, value)) setPending(null);
  const shown = pending && Object.is(pending.over, value) ? pending.value : value;

  async function commit(next: Value) {
    if (Object.is(next, shown)) return;
    const run = ++latest.current;
    setPending({ value: next, over: value });
    setStatus({ kind: "saving" });
    const result = await attempt(() => save(next));
    // A later change to the same cell owns the cell now.
    if (run !== latest.current) return;
    if (result.ok) {
      setStatus({ kind: "saved" });
    } else {
      setPending(null);
      setStatus({ kind: "refused", error: result.error, link: result.link });
    }
  }

  return {
    shown,
    status,
    commit,
    /** Clears the mark or the reason, when the person starts changing the cell again. */
    clear: () => setStatus((current) => (current.kind === "saving" ? current : { kind: "idle" })),
  };
}

/** The reason a change was refused, under the cell or the row. */
export function Refusal({ error, link }: { error: string; link?: { href: string; label: string } }) {
  return (
    <p role="alert" className="px-2 text-sm text-destructive">
      {error}
      {link ? (
        <>
          {" "}
          <Link href={link.href} className="font-semibold underline underline-offset-4">
            {link.label}
          </Link>
        </>
      ) : null}
    </p>
  );
}

/** True inside a table with many columns: the "Saved" mark is only its tick. */
export const DenseTable = createContext(false);

/** A cell's editor with its "Saved" mark beside it and a refusal's reason under it. */
function CellFrame({ status, children }: { status: CellStatus; children: ReactNode }) {
  const dense = useContext(DenseTable);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {children}
        <span
          aria-live="polite"
          className={cn(
            "flex shrink-0 items-center gap-1 text-xs text-muted-foreground",
            dense ? "w-4" : "w-16",
          )}
        >
          {status.kind === "saving" ? (
            <>
              <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
              <span className="sr-only">Saving</span>
            </>
          ) : status.kind === "saved" ? (
            <>
              <Check aria-hidden className="size-3.5" />
              <span className={dense ? "sr-only" : undefined}>Saved</span>
            </>
          ) : null}
        </span>
      </div>
      {status.kind === "refused" ? <Refusal error={status.error} link={status.link} /> : null}
    </div>
  );
}

/** How every editor looks: plain text until it is pointed at or focused. */
export const editorClass =
  "h-8 min-w-0 rounded-md border border-transparent bg-transparent px-2 text-left outline-none transition-colors hover:border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 aria-invalid:border-destructive/60";

type CellProps<Value> = {
  /** Names the cell for screen readers, for example "Start of the 9:30 AM slot". */
  label: string;
  value: Value;
  save: (next: Value) => Promise<CellResult>;
};

/** A typed value. Saves when the person leaves the cell or presses Enter; Escape cancels. */
function InputCell({
  label,
  value,
  save,
  type,
  placeholder,
  maxLength,
}: CellProps<string> & { type: "time" | "text"; placeholder?: string; maxLength?: number }) {
  const cell = useCellSave(value, save);
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);

  return (
    <CellFrame status={cell.status}>
      <input
        type={type}
        step={type === "time" ? 60 : undefined}
        aria-label={label}
        aria-invalid={cell.status.kind === "refused" || undefined}
        className={cn(editorClass, type === "time" ? "w-32" : "w-full flex-1")}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        value={draft ?? cell.shown}
        onChange={(event) => {
          setDraft(event.target.value);
          cell.clear();
        }}
        onBlur={() => {
          const next = draft;
          setDraft(null);
          if (cancelled.current) {
            cancelled.current = false;
            return;
          }
          if (next !== null) void cell.commit(type === "text" ? next.trim() : next);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            cancelled.current = true;
            event.currentTarget.blur();
          }
        }}
      />
    </CellFrame>
  );
}

/** A time of day. */
export function TimeCell(props: CellProps<string>) {
  return <InputCell {...props} type="time" />;
}

/** A line of text. */
export function TextCell(props: CellProps<string> & { placeholder?: string; maxLength?: number }) {
  return <InputCell {...props} type="text" />;
}

/** A yes or no. Saves when it is ticked or cleared. */
export function CheckboxCell({ label, value, save }: CellProps<boolean>) {
  const cell = useCellSave(value, save);
  return (
    <CellFrame status={cell.status}>
      <span className="flex h-8 items-center px-2">
        <input
          type="checkbox"
          aria-label={label}
          aria-invalid={cell.status.kind === "refused" || undefined}
          className="size-5 accent-primary"
          checked={cell.shown}
          onChange={(event) => {
            cell.clear();
            void cell.commit(event.target.checked);
          }}
        />
      </span>
    </CellFrame>
  );
}

/** The choices under their headings, in the order they came in. */
function groupOptions(options: EditableOption[]) {
  const groups: { heading: string | undefined; options: EditableOption[] }[] = [];
  for (const option of options) {
    const last = groups.at(-1);
    if (last && last.heading === option.group) last.options.push(option);
    else groups.push({ heading: option.group, options: [option] });
  }
  return groups;
}

type PickerProps = {
  label: string;
  options: EditableOption[];
  /** The values picked now: one for a dropdown, any number for a multi-pick. */
  picked: string[];
  /** What the closed picker shows. */
  summary: string;
  muted?: boolean;
  invalid?: boolean;
  searchPlaceholder?: string;
  className?: string;
  /** A multi-pick stays open while choices are ticked. */
  keepOpen?: boolean;
  onPick: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
};

/** A searchable list of choices behind a button, for a cell or the blank row. */
export function Picker({
  label,
  options,
  picked,
  summary,
  muted,
  invalid,
  searchPlaceholder = "Search",
  className,
  keepOpen = false,
  onPick,
  onOpenChange,
}: PickerProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const change = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Popover open={open} onOpenChange={change}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={label}
          aria-invalid={invalid || undefined}
          className={cn(editorClass, "flex flex-1 items-center justify-between gap-2", className)}
        >
          <span className={cn("truncate", muted && "text-muted-foreground")}>{summary}</span>
          <ChevronsUpDown aria-hidden className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent id={listId} align="start" className="w-(--radix-popover-trigger-width) min-w-80 p-0">
        <Command
          filter={(_value, search, keywords) =>
            (keywords ?? []).join(" ").toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>Nothing matches.</CommandEmpty>
            {groupOptions(options).map((group, index) => (
              <CommandGroup key={group.heading ?? index} heading={group.heading}>
                {group.options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={[option.label]}
                    disabled={Boolean(option.unavailable)}
                    onSelect={() => {
                      if (!keepOpen) change(false);
                      onPick(option.value);
                    }}
                  >
                    <Check
                      aria-hidden
                      className={cn("size-4", picked.includes(option.value) ? "opacity-100" : "opacity-0")}
                    />
                    <span>{option.label}</span>
                    {option.unavailable || option.note ? (
                      <span className="ml-auto pl-3 text-xs text-muted-foreground">
                        {option.unavailable ?? option.note}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** A searchable dropdown. Picking a choice saves it. */
export function SelectCell({
  label,
  value,
  save,
  options,
  searchPlaceholder,
}: CellProps<string> & { options: EditableOption[]; searchPlaceholder?: string }) {
  const cell = useCellSave(value, save);
  const current = options.find((option) => option.value === cell.shown);

  return (
    <CellFrame status={cell.status}>
      <Picker
        label={label}
        options={options}
        picked={[cell.shown]}
        summary={current?.label ?? "Choose"}
        muted={!current || current.muted}
        invalid={cell.status.kind === "refused"}
        searchPlaceholder={searchPlaceholder}
        onPick={(next) => void cell.commit(next)}
        onOpenChange={(open) => {
          if (open) cell.clear();
        }}
      />
    </CellFrame>
  );
}

/** The labels of the picked choices, in the order of the list. */
export function pickedSummary(options: EditableOption[], picked: string[], none = "None") {
  const labels = options.filter((option) => picked.includes(option.value)).map((option) => option.label);
  return labels.length > 0 ? labels.join(", ") : none;
}

/** The picked values after one is ticked or cleared, in the order of the list. */
export function togglePicked(options: EditableOption[], picked: string[], value: string) {
  const next = picked.includes(value) ? picked.filter((item) => item !== value) : [...picked, value];
  return options.map((option) => option.value).filter((item) => next.includes(item));
}

/** Several choices from a list. Saves when the list closes. */
export function MultiCell({
  label,
  value,
  save,
  options,
  searchPlaceholder,
  summary,
}: CellProps<string[]> & {
  options: EditableOption[];
  searchPlaceholder?: string;
  summary?: (values: string[]) => string;
}) {
  // Kept as one string, so a value that did not change is the same value.
  const cell = useCellSave(value.join(","), (next) => save(next ? next.split(",") : []));
  const [draft, setDraft] = useState<string[] | null>(null);
  const picked = draft ?? (cell.shown ? cell.shown.split(",") : []);

  return (
    <CellFrame status={cell.status}>
      <Picker
        label={label}
        options={options}
        picked={picked}
        summary={picked.length > 0 && summary ? summary(picked) : pickedSummary(options, picked)}
        muted={picked.length === 0}
        invalid={cell.status.kind === "refused"}
        searchPlaceholder={searchPlaceholder}
        keepOpen
        onPick={(next) => setDraft(togglePicked(options, picked, next))}
        onOpenChange={(open) => {
          if (open) {
            cell.clear();
            return;
          }
          if (draft) void cell.commit(draft.join(","));
          setDraft(null);
        }}
      />
    </CellFrame>
  );
}
