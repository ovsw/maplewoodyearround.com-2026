"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { HeaderTheme } from "./theme";

export const SITE_HEADER_OFFSET_PROPERTY = "--site-header-offset";

export function SiteHeaderShell({
  children,
  theme,
}: {
  children: ReactNode;
  theme: HeaderTheme;
}) {
  const [visible, setVisible] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const update = () => {
      const current = window.scrollY;
      const delta = current - lastScrollY.current;

      setAtTop(current <= 24);
      if (current <= 8) setVisible(true);
      else if (Math.abs(delta) >= 8) setVisible(delta < 0 || current < 120);

      if (Math.abs(delta) >= 8 || current <= 8) lastScrollY.current = current;
      ticking.current = false;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(update);
    };

    const initialFrame = window.requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      SITE_HEADER_OFFSET_PROPERTY,
      visible ? "var(--header-height)" : "0px",
    );
    return () => {
      document.documentElement.style.removeProperty(SITE_HEADER_OFFSET_PROPERTY);
    };
  }, [visible]);

  return (
    <header
      className={cn(
        "sticky top-0 z-60 w-full rounded-b-[var(--radius-lg)] border-b transition-[transform,background-color,border-color] duration-300 ease-reveal motion-reduce:transition-none",
        theme === "dark" ? "field-night border-border" : "field-cream border-foreground/15",
        visible ? "translate-y-0" : "-translate-y-full",
      )}
      data-at-top={atTop}
      data-site-header
      data-theme={theme}
      data-visible={visible}
      onFocusCapture={() => setVisible(true)}
    >
      {children}
    </header>
  );
}
