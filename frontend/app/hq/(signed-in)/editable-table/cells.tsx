"use client";

// The cells of the Camp HQ editable table: each saves by itself, shows a small
// "Saved" mark, and on a refusal shows the reason and goes back to its old value.
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

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

/** A cell's editor with its "Saved" mark beside it and a refusal's reason under it. */
function CellFrame({ status, children }: { status: CellStatus; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {children}
        <span
          aria-live="polite"
          className="flex w-16 shrink-0 items-center gap-1 text-xs text-muted-foreground"
        >
          {status.kind === "saving" ? (
            <>
              <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
              <span className="sr-only">Saving</span>
            </>
          ) : status.kind === "saved" ? (
            <>
              <Check aria-hidden className="size-3.5" />
              Saved
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
  "h-10 min-w-0 rounded-control border border-transparent bg-transparent px-2 text-left outline-none transition-colors hover:border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 aria-invalid:border-destructive/60";

type CellProps<Value> = {
  /** Names the cell for screen readers, for example "Start of the 9:30 AM slot". */
  label: string;
  value: Value;
  save: (next: Value) => Promise<CellResult>;
};

/** A time of day. Saves when the person leaves the cell or presses Enter; Escape cancels. */
export function TimeCell({ label, value, save }: CellProps<string>) {
  const cell = useCellSave(value, save);
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);

  return (
    <CellFrame status={cell.status}>
      <input
        type="time"
        step={60}
        aria-label={label}
        aria-invalid={cell.status.kind === "refused" || undefined}
        className={cn(editorClass, "w-32")}
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
          if (next !== null) void cell.commit(next);
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

/** A searchable dropdown. Picking a choice saves it. */
export function SelectCell({
  label,
  value,
  save,
  options,
  searchPlaceholder = "Search",
}: CellProps<string> & { options: EditableOption[]; searchPlaceholder?: string }) {
  const cell = useCellSave(value, save);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const current = options.find((option) => option.value === cell.shown);

  return (
    <CellFrame status={cell.status}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) cell.clear();
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-label={label}
            aria-invalid={cell.status.kind === "refused" || undefined}
            className={cn(editorClass, "flex flex-1 items-center justify-between gap-2")}
          >
            <span className="truncate">{current?.label ?? "Choose"}</span>
            <ChevronsUpDown aria-hidden className="size-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent id={listId} align="start" className="w-(--radix-popover-trigger-width) min-w-80 p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>Nothing matches.</CommandEmpty>
              {groupOptions(options).map((group, index) => (
                <CommandGroup key={group.heading ?? index} heading={group.heading}>
                  {group.options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      disabled={Boolean(option.unavailable)}
                      onSelect={() => {
                        setOpen(false);
                        void cell.commit(option.value);
                      }}
                    >
                      <Check
                        aria-hidden
                        className={cn("size-4", option.value === cell.shown ? "opacity-100" : "opacity-0")}
                      />
                      <span>{option.label}</span>
                      {option.unavailable ? (
                        <span className="ml-auto pl-3 text-xs">{option.unavailable}</span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </CellFrame>
  );
}
