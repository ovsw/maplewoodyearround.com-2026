"use client";

import { useEffect, useState } from "react";
import css from "./maplewood-inner.module.css";

/*
 * The large step number beside the steps: it shows the step nearest the
 * middle of the screen. The steps keep their own numbers on phones.
 */
export default function InstructionStepsNumber({ stepIds }: { stepIds: string[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const steps = stepIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(steps.indexOf(entry.target as HTMLElement));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, [stepIds]);
  return (
    <div aria-hidden="true" className={css.stepsNumber}>
      {String(active + 1).padStart(2, "0")}
    </div>
  );
}
