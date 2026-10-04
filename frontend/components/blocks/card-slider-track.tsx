"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import css from "./maplewood-inner.module.css";

/*
 * Native replacement for the live site's Swiper slider: a scroll-snap track
 * with previous/next buttons and one dot per card. Keyboard and touch
 * scrolling work without the buttons.
 */
export default function CardSliderTrack({
  children,
  count,
  label,
}: {
  children: React.ReactNode;
  count: number;
  label: string;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const update = useCallback(() => {
    const node = track.current;
    const first = node?.firstElementChild as HTMLElement | null;
    if (!node || !first) return;
    const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(node).columnGap || "0");
    const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 2;
    setActive(atEnd ? count - 1 : Math.round(node.scrollLeft / step));
  }, [count]);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    node.addEventListener("scroll", update, { passive: true });
    return () => node.removeEventListener("scroll", update);
  }, [update]);

  const go = (index: number) => {
    const node = track.current;
    const target = node?.children[Math.max(0, Math.min(count - 1, index))] as HTMLElement | undefined;
    if (!node || !target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollTo({ left: target.offsetLeft - node.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className={css.slider}>
      <div className={css.sliderControls}>
        <div className={css.sliderButtons}>
          <button aria-label={`Previous: ${label}`} className={css.sliderButton} onClick={() => go(active - 1)} type="button">
            <ArrowLeft aria-hidden size={16} />
          </button>
          <button aria-label={`Next: ${label}`} className={css.sliderButton} onClick={() => go(active + 1)} type="button">
            <ArrowRight aria-hidden size={16} />
          </button>
        </div>
        <div aria-hidden="true" className={css.sliderDots}>
          {Array.from({ length: count }, (_, index) => (
            <span className={index === active ? css.sliderDotActive : css.sliderDot} key={index} />
          ))}
        </div>
      </div>
      <ul aria-label={label} className={css.sliderTrack} ref={track}>
        {children}
      </ul>
    </div>
  );
}
