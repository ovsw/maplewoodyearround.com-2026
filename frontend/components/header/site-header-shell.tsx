"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { HeaderTheme } from "./theme";
import styles from "./maplewood-header.module.css";

export const SITE_HEADER_OFFSET_PROPERTY = "--site-header-offset";

export function SiteHeaderShell({
  children,
  theme,
  forceVisible = false,
}: {
  children: ReactNode;
  theme: HeaderTheme;
  forceVisible?: boolean;
}) {
  const [visible, setVisible] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const current = window.scrollY;
      const delta = current - lastScrollY.current;
      setAtTop(current <= 24);
      if (reducedMotion.matches || current <= 8) setVisible(true);
      else if (Math.abs(delta) >= 8) setVisible(delta < 0 || current < 120);
      if (Math.abs(delta) >= 8 || current <= 8) lastScrollY.current = current;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    reducedMotion.addEventListener("change", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      reducedMotion.removeEventListener("change", onScroll);
    };
  }, []);

  const shown = forceVisible || visible;
  useEffect(() => {
    document.documentElement.style.setProperty(
      SITE_HEADER_OFFSET_PROPERTY,
      shown ? "var(--header-height)" : "0px",
    );
    return () => {
      document.documentElement.style.removeProperty(
        SITE_HEADER_OFFSET_PROPERTY,
      );
    };
  }, [shown]);

  return (
    <header
      className={styles.header}
      data-at-top={atTop}
      data-site-header
      data-theme={theme}
      data-visible={shown}
      onFocusCapture={() => setVisible(true)}
    >
      {children}
    </header>
  );
}
