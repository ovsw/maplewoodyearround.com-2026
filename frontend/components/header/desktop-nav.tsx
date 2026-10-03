"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";
import { HeaderLink } from "./header-link";
import type {
  HeaderChildLinkModel,
  HeaderNavigationItem,
  HeaderNavigationModel,
} from "./model";
import { NavigationIcon } from "./navigation-icon";
import type { HeaderTheme } from "./theme";

const SINGLE_COLUMN_PANEL_WIDTH = 380;
const TWO_COLUMN_PANEL_WIDTH = 740;
const TWO_COLUMN_MIN_LINKS = 6;
const VIEWPORT_EDGE_GAP = 16;
const CLOSE_DELAY_MS = 120;

type PanelPlacement = {
  x: number;
  height: number | null;
};

type ActiveGroup = {
  key: string;
  animate: boolean;
};

function GroupPanelContent({
  label,
  links,
  theme,
}: {
  label: string;
  links: HeaderChildLinkModel[];
  theme: HeaderTheme;
}) {
  const dark = theme === "dark";
  const firstColumnLength = Math.ceil(links.length / 2);
  const columns =
    links.length >= TWO_COLUMN_MIN_LINKS
      ? [links.slice(0, firstColumnLength), links.slice(firstColumnLength)]
      : [links];

  return (
    <div className="p-3">
      <p
        className={cn(
          "text-label mb-2 px-2",
          dark ? "text-foreground/55" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <div className={cn("grid gap-3", columns.length === 2 && "grid-cols-2")}>
        {columns.map((column, columnIndex) => (
          <div className="grid content-start gap-1" key={columnIndex}>
            {column.map((child) => (
              <HeaderLink
                className="group/nav-link flex items-start gap-3 rounded-[var(--radius-md)] px-2 py-2.5 transition-colors motion-fast hover:bg-accent focus-ring"
                key={child.key}
                link={child.link}
              >
                {child.icon ? (
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full text-link transition-colors motion-fast [&_svg]:size-5",
                      dark
                        ? "bg-fill-forest group-hover/nav-link:bg-fill-forest/75"
                        : "bg-link/10 group-hover/nav-link:bg-link/15",
                    )}
                  >
                    <NavigationIcon icon={child.icon} />
                  </span>
                ) : null}
                <span className="grid min-w-0 gap-1">
                  <span className="flex items-center gap-0.5 text-sm font-semibold">
                    {child.label}
                    <ChevronRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-link opacity-0 transition-all motion-fast group-hover/nav-link:translate-x-0.5 group-hover/nav-link:opacity-100"
                    />
                  </span>
                  {child.description ? (
                    <span
                      className={cn(
                        "text-[15px] leading-tight",
                        dark ? "text-foreground/65" : "text-muted-foreground",
                      )}
                    >
                      {child.description}
                    </span>
                  ) : null}
                </span>
              </HeaderLink>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DesktopNav({
  navigation,
  theme,
}: {
  navigation: HeaderNavigationModel;
  theme: HeaderTheme;
}) {
  const [active, setActive] = useState<ActiveGroup | null>(null);
  const [placement, setPlacement] = useState<PanelPlacement | null>(null);
  const [contentNode, setContentNode] = useState<HTMLDivElement | null>(null);
  const hasPlacement = useRef(false);
  const navRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const panelId = useId();
  const dark = theme === "dark";

  const groups = useMemo(
    () =>
      navigation.items.filter(
        (item): item is Extract<HeaderNavigationItem, { kind: "group" }> =>
          item.kind === "group",
      ),
    [navigation.items],
  );
  const activeItem = groups.find((group) => group.key === active?.key) ?? null;
  const panelWidth =
    activeItem && activeItem.links.length >= TWO_COLUMN_MIN_LINKS
      ? TWO_COLUMN_PANEL_WIDTH
      : SINGLE_COLUMN_PANEL_WIDTH;

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const openGroup = useCallback(
    (key: string, animate: boolean) => {
      cancelClose();
      setActive((current) =>
        current?.key === key
          ? current
          : { key, animate: animate && hasPlacement.current },
      );
    },
    [cancelClose],
  );

  const closeGroup = useCallback(() => {
    cancelClose();
    setActive(null);
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActive(null), CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  useLayoutEffect(() => {
    if (!active) {
      hasPlacement.current = false;
      return;
    }

    const nav = navRef.current;
    const trigger = triggerRefs.current.get(active.key);
    if (!nav || !trigger) return;

    const measure = () => {
      const navBox = nav.getBoundingClientRect();
      const triggerBox = trigger.getBoundingClientRect();
      const triggerCenter = triggerBox.left - navBox.left + triggerBox.width / 2;
      const centeredX = triggerCenter - panelWidth / 2;
      const minX = VIEWPORT_EDGE_GAP - navBox.left;
      const maxX =
        window.innerWidth - VIEWPORT_EDGE_GAP - navBox.left - panelWidth;
      const x = Math.min(
        Math.max(centeredX, minX),
        maxX,
      );
      const measuredHeight = contentNode?.offsetHeight ?? 0;
      const height = measuredHeight > 0 ? measuredHeight : null;

      setPlacement((current) =>
        current?.x === x && current.height === height ? current : { x, height },
      );
      hasPlacement.current = true;
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    if (contentNode) observer.observe(contentNode);
    return () => observer.disconnect();
  }, [active, contentNode, panelWidth]);

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) closeGroup();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !active) return;
    event.preventDefault();
    const trigger = triggerRefs.current.get(active.key);
    closeGroup();
    trigger?.focus();
  };

  const animated = Boolean(active?.animate) && !prefersReducedMotion;
  const morph = animated
    ? { damping: 30, mass: 0.6, stiffness: 380, type: "spring" as const }
    : { duration: 0 };
  const fade = { duration: prefersReducedMotion ? 0 : 0.14 };
  // The open trigger and its panel are one surface, so they share a colour.
  const panelSurfaceClassName = "bg-card text-card-foreground";
  const primaryLinkClassName = cn(
    // px-2 -mx-1 keeps the same flow width as the old px-1 while giving the
    // hover pill room around the label.
    "-mx-1 flex min-h-11 items-center whitespace-nowrap rounded-control px-2 text-[15px] font-medium text-soft-foreground transition-colors motion-fast focus-ring",
    dark
      ? "hover:bg-foreground/8 hover:text-foreground"
      : "hover:bg-link/10 hover:text-link-hover",
  );

  return (
    <nav
      aria-label="Main navigation"
      className="relative hidden items-center gap-3 xl:flex 2xl:gap-5"
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onMouseLeave={scheduleClose}
      ref={navRef}
    >
      {navigation.items.map((item) => {
        if (item.kind === "link") {
          return (
            <HeaderLink
              className={primaryLinkClassName}
              key={item.key}
              link={item.link}
            />
          );
        }

        const isActive = active?.key === item.key;
        return (
          <button
            aria-controls={isActive ? panelId : undefined}
            aria-expanded={isActive}
            className={cn(
              primaryLinkClassName,
              "mx-0 gap-1.5 px-2.5",
              isActive && [panelSurfaceClassName, "hover:text-card-foreground"],
            )}
            key={item.key}
            onClick={(event) => {
              const pointerType = (event.nativeEvent as PointerEvent).pointerType;
              const canToggle =
                event.detail === 0 || pointerType === "touch" || pointerType === "pen";

              if (canToggle && isActive) closeGroup();
              else openGroup(item.key, false);
            }}
            onMouseEnter={() => openGroup(item.key, true)}
            ref={(node) => {
              if (node) triggerRefs.current.set(item.key, node);
              else triggerRefs.current.delete(item.key);
            }}
            type="button"
          >
            <span className="leading-none">{item.label}</span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-3 shrink-0 -translate-y-px transition-transform motion-fast motion-reduce:transition-none",
                isActive && "rotate-180",
              )}
            />
          </button>
        );
      })}

      <AnimatePresence>
        {activeItem ? (
          <motion.div
            animate={{ opacity: 1, x: placement?.x ?? 0, y: 0 }}
            className="absolute top-full left-0 z-70 pt-1.5"
            exit={{ opacity: 0, transition: fade, y: -4 }}
            id={panelId}
            initial={{ opacity: 0, x: placement?.x ?? 0, y: -4 }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            style={{ width: panelWidth }}
            transition={{ opacity: fade, x: morph, y: fade }}
          >
            <motion.div
              animate={{ height: placement?.height ?? "auto" }}
              className={cn(
                "relative overflow-hidden rounded-[var(--radius-md)] border border-border",
                panelSurfaceClassName,
                dark ? "shadow-lift" : "shadow-card-rest-cream",
              )}
              initial={false}
              transition={morph}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  initial={{ opacity: animated ? 0 : 1 }}
                  key={activeItem.key}
                  ref={setContentNode}
                  transition={{ duration: prefersReducedMotion || !animated ? 0 : 0.16 }}
                >
                  <GroupPanelContent
                    label={activeItem.label}
                    links={activeItem.links}
                    theme={theme}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}
