"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import styles from "./quote-wall.module.css";

export type QuoteWallItem = Readonly<{
  key: string;
  node: ReactNode;
}>;

type QuoteWallListProps = Readonly<{
  items: readonly QuoteWallItem[];
  /** Cards visible before the first press of "Show more". */
  initialCount: number;
  /** Cards each press reveals. */
  step: number;
  /** Section background is dark, so the button needs its light outline. */
  onDark?: boolean;
  dataSanity?: string;
}>;

/**
 * The wall itself, plus "Show more". Every card is in the markup from the
 * server; cards past the visible count carry the `hidden` attribute, so
 * revealing more is instant and nothing is fetched. After a reveal, focus
 * moves to the first new card so keyboard and screen-reader users land on
 * what just appeared.
 */
export default function QuoteWallList({
  dataSanity,
  initialCount,
  items,
  onDark = false,
  step,
}: QuoteWallListProps) {
  const [visible, setVisible] = useState(Math.min(initialCount, items.length));
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  /** Key of the card to focus once the next reveal has rendered. */
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    const key = pendingFocus.current;
    if (!key) return;
    pendingFocus.current = null;
    itemRefs.current.get(key)?.focus();
  }, [visible]);

  const remaining = items.length - visible;
  const paged = items.length > initialCount;

  const reveal = () => {
    pendingFocus.current = items[visible]?.key ?? null;
    setVisible(Math.min(items.length, visible + step));
  };

  return (
    <div className={styles.list}>
      <div className={styles.wall} data-sanity={dataSanity}>
        {items.map((item, index) => (
          <div
            className={styles.item}
            hidden={index >= visible}
            key={item.key}
            ref={(element) => {
              if (element) itemRefs.current.set(item.key, element);
              else itemRefs.current.delete(item.key);
            }}
            tabIndex={-1}
          >
            {item.node}
          </div>
        ))}
      </div>

      {paged ? (
        <div className={styles.more}>
          <p aria-live="polite" className={styles.count}>
            Showing {visible} of {items.length} quotes
          </p>
          {remaining > 0 ? (
            <Button onClick={reveal} onDark={onDark} type="button" variant="outline">
              Show {Math.min(step, remaining)} more {remaining === 1 ? "quote" : "quotes"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
