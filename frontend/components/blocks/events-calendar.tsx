"use client";

import { useEffect, useRef } from "react";

// The Events Calendar public loader. The calendar is chosen by its project ID.
const LOADER = "https://dist.eventscalendar.co/embed.js";

/** The Events Calendar embed for one public calendar project. */
export default function EventsCalendar({ projectId }: { projectId: string }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const app = document.createElement("div");
    app.setAttribute("data-events-calendar-app", "");
    app.dataset.projectId = projectId;
    const script = document.createElement("script");
    script.src = LOADER;
    node.append(app, script);
    return () => node.replaceChildren();
  }, [projectId]);
  return <div ref={container} />;
}
