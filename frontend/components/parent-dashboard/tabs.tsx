"use client";

import { useRef, useState } from "react";
import styles from "./parent-dashboard.module.css";

type Tab = { key: string; label: React.ReactNode; dataSanity?: string };

/* The season tabs. As live, the last tab (Summer Camp) opens first. */
export default function ParentDashboardTabs({
  panels,
  tabs,
}: {
  panels: React.ReactNode[];
  tabs: Tab[];
}) {
  const [active, setActive] = useState(tabs.length - 1);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : undefined;
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    buttons.current[next]?.focus();
  };

  return (
    <div className={styles.tabs}>
      <div aria-label="Season" className={styles.tabList} role="tablist">
        {tabs.map((tab, index) => (
          <button
            aria-controls={`parent-dashboard-panel-${tab.key}`}
            aria-selected={index === active}
            className={styles.tab}
            id={`parent-dashboard-tab-${tab.key}`}
            key={tab.key}
            onClick={() => setActive(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            role="tab"
            tabIndex={index === active ? 0 : -1}
            type="button"
          >
            <span data-sanity={tab.dataSanity}>{tab.label}</span>
          </button>
        ))}
      </div>
      {panels.map((panel, index) => (
        <div
          aria-labelledby={`parent-dashboard-tab-${tabs[index].key}`}
          hidden={index !== active}
          id={`parent-dashboard-panel-${tabs[index].key}`}
          key={tabs[index].key}
          role="tabpanel"
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
