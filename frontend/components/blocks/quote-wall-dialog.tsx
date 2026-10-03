"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import styles from "./quote-wall.module.css";

type QuoteWallDialogProps = Readonly<{
  /** Text of the link on the card, e.g. "Read the full quote". */
  label: string;
  /** Who is quoted, for the dialog's accessible name. */
  name: string;
  /** The complete card, rendered without clamping. */
  children: ReactNode;
}>;

/**
 * "Read the full quote": a link on a clamped card that opens the whole quote
 * in a centred dialog over the page. The dialog holds the same card, so the
 * reader sees one thing grow, not a second design.
 */
export default function QuoteWallDialog({
  children,
  label,
  name,
}: QuoteWallDialogProps) {
  return (
    <Dialog>
      <DialogTrigger className={styles.readMore} type="button">
        {label}
      </DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-none border-0 bg-transparent p-0 shadow-none sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">Quote from {name}</DialogTitle>
        <div className={styles.dialogCard}>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
