"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./tabbed-hero.module.css";

const INTERVAL = 6000;

type Tab = { key: string; label: string; dataSanity?: string };

/*
 * Tab switching for the tabbed hero. As live, the tabs advance every six
 * seconds. Hovering pauses the rotation; choosing a tab or moving keyboard
 * focus into the hero stops it for good (WCAG 2.2.2). Visitors who prefer
 * reduced motion get no rotation.
 */
export default function TabbedHeroTabs({
  id,
  images,
  panels,
  tabs,
}: {
  id: string;
  images: React.ReactNode[];
  panels: React.ReactNode[];
  tabs: Tab[];
}) {
  const [active, setActive] = useState(0);
  const [rotating, setRotating] = useState(false);
  const [paused, setPaused] = useState(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setRotating(!motion.matches && tabs.length > 1);
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, [tabs.length]);

  useEffect(() => {
    if (!rotating || paused) return;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % tabs.length), INTERVAL);
    return () => window.clearTimeout(timer);
  }, [active, paused, rotating, tabs.length]);

  const choose = useCallback((index: number, focus = false) => {
    setRotating(false);
    setActive(index);
    if (focus) buttons.current[index]?.focus();
  }, []);

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : undefined;
    if (next === undefined) return;
    event.preventDefault();
    choose(next, true);
  };

  return (
    <header
      className={styles.hero}
      onFocus={() => setRotating(false)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.images}>
        {images.map((image, index) => (
          <div aria-hidden={index !== active} className={styles.imageLayer} data-active={index === active || undefined} key={tabs[index]?.key ?? index}>
            {image}
          </div>
        ))}
        <div className={styles.overlay} />
      </div>
      <div className={styles.inner}>
        {panels.map((panel, index) => (
          <div
            aria-labelledby={`${id}-tab-${index}`}
            className={styles.panel}
            hidden={index !== active}
            id={`${id}-panel-${index}`}
            key={tabs[index]?.key ?? index}
            role="tabpanel"
          >
            {panel}
          </div>
        ))}
        {tabs.length > 1 ? (
          <div aria-label="Programs" className={styles.tabList} role="tablist">
            {tabs.map((tab, index) => (
              <button
                aria-controls={`${id}-panel-${index}`}
                aria-selected={index === active}
                className={styles.tab}
                data-rotating={(rotating && !paused && index === active) || undefined}
                id={`${id}-tab-${index}`}
                key={tab.key}
                onClick={() => choose(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
                ref={(node) => {
                  buttons.current[index] = node;
                }}
                role="tab"
                tabIndex={index === active ? 0 : -1}
                type="button"
              >
                <span data-sanity={tab.dataSanity}>{tab.label}</span>
                <span aria-hidden className={styles.progress}>
                  <span key={`${active}-${rotating}-${paused}`} />
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
