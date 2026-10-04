"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import css from "./maplewood-inner.module.css";

/*
 * Native replacement for the live site's Swiper slider: a scroll-snap track
 * with previous/next buttons and one dot per reachable position. Visitors can
 * also drag the cards with a mouse, swipe on touch screens, scroll with a
 * trackpad, or focus the track and use the arrow keys.
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
  const drag = useRef<{ id: number; x: number; left: number; moved: boolean } | null>(null);
  const [active, setActive] = useState(0);
  // Cards that can sit at the left edge. The last cards share the end position.
  const [stops, setStops] = useState(count);

  const offsets = useCallback(() => {
    const node = track.current;
    if (!node) return [];
    const max = node.scrollWidth - node.clientWidth;
    const lefts = [...node.children].map((child) => (child as HTMLElement).offsetLeft - node.offsetLeft);
    const reachable = lefts.filter((left) => left < max - 1);
    return max > 1 ? [...reachable, max] : [0];
  }, []);

  const update = useCallback(() => {
    const node = track.current;
    if (!node) return;
    const positions = offsets();
    setStops(positions.length);
    let nearest = 0;
    positions.forEach((left, index) => {
      if (Math.abs(left - node.scrollLeft) < Math.abs(positions[nearest] - node.scrollLeft)) nearest = index;
    });
    setActive(nearest);
  }, [offsets]);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    update();
    node.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      node.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const go = (index: number) => {
    const node = track.current;
    const positions = offsets();
    if (!node || !positions.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollTo({
      left: positions[Math.max(0, Math.min(positions.length - 1, index))],
      behavior: reduce ? "auto" : "smooth",
    });
  };

  // Mouse dragging. Touch and pen keep the browser's native swipe.
  const onPointerDown = (event: React.PointerEvent<HTMLUListElement>) => {
    const node = track.current;
    if (!node || event.pointerType !== "mouse" || event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX, left: node.scrollLeft, moved: false };
  };
  const onPointerMove = (event: React.PointerEvent<HTMLUListElement>) => {
    const node = track.current;
    const state = drag.current;
    if (!node || !state || state.id !== event.pointerId) return;
    const distance = event.clientX - state.x;
    if (!state.moved && Math.abs(distance) < 4) return;
    if (!state.moved) {
      state.moved = true;
      node.setPointerCapture(event.pointerId);
      node.dataset.dragging = "";
    }
    node.scrollLeft = state.left - distance;
  };
  const endDrag = (event: React.PointerEvent<HTMLUListElement>) => {
    const node = track.current;
    const state = drag.current;
    if (!node || !state || state.id !== event.pointerId) return;
    drag.current = null;
    if (!state.moved) return;
    if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
    delete node.dataset.dragging;
    // Settle on the nearest card, as the snap points do for other input.
    const positions = offsets();
    let nearest = 0;
    positions.forEach((left, index) => {
      if (Math.abs(left - node.scrollLeft) < Math.abs(positions[nearest] - node.scrollLeft)) nearest = index;
    });
    go(nearest);
  };

  return (
    <div className={css.slider}>
      <div className={css.sliderControls}>
        <div className={css.sliderButtons}>
          <button aria-label={`Previous: ${label}`} className={css.sliderButton} disabled={active === 0} onClick={() => go(active - 1)} type="button">
            <ArrowLeft aria-hidden size={16} />
          </button>
          <button aria-label={`Next: ${label}`} className={css.sliderButton} disabled={active >= stops - 1} onClick={() => go(active + 1)} type="button">
            <ArrowRight aria-hidden size={16} />
          </button>
        </div>
        {stops > 1 ? (
          <div className={css.sliderDots}>
            {Array.from({ length: stops }, (_, index) => (
              <button
                aria-current={index === active ? "true" : undefined}
                aria-label={`${label}: position ${index + 1} of ${stops}`}
                className={index === active ? css.sliderDotActive : css.sliderDot}
                key={index}
                onClick={() => go(index)}
                type="button"
              />
            ))}
          </div>
        ) : null}
      </div>
      {/* Focusable so keyboard users can scroll the cards with arrow keys. */}
      <ul
        aria-label={label}
        className={css.sliderTrack}
        onDragStart={(event) => event.preventDefault()}
        onPointerCancel={endDrag}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        ref={track}
        tabIndex={0}
      >
        {children}
      </ul>
    </div>
  );
}
