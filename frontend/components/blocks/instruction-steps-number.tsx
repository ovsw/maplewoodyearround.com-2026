"use client";

import { useEffect, useState } from "react";
import css from "./maplewood-inner.module.css";

/*
 * The large step number beside the steps: it shows the last step whose top
 * has passed the middle of the screen. The steps keep their own numbers on phones.
 */
export default function InstructionStepsNumber({ stepIds }: { stepIds: string[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      const passed = stepIds.filter((id) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= middle);
      setActive(Math.max(0, passed.length - 1));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [stepIds]);
  return (
    <div aria-hidden="true" className={css.stepsNumber}>
      {String(active + 1).padStart(2, "0")}
    </div>
  );
}
