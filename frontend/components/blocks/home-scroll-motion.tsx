"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

/** Only the two source sections whose composition depends on scroll are animated. */
export default function HomeScrollMotion({ kind, className, children }: { kind: "panels" | "reveal"; className: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const element = root.current;
      if (!element) return;
      element.dataset.moving = "true";
      if (kind === "reveal") {
        const image = element.querySelector("[data-reveal-image]");
        gsap.fromTo(image, { width: "200%" }, { width: "100%", ease: "none", scrollTrigger: { trigger: element, start: "top 50%", end: "bottom bottom", scrub: true } });
      } else {
        const panels = [...element.querySelectorAll<HTMLElement>("[data-panel-content]")];
        const select = (index: number) => panels.forEach((panel, i) => {
          panel.style.opacity = i === index ? "1" : "0";
          panel.style.visibility = i === index ? "visible" : "hidden";
          panel.inert = i !== index;
        });
        select(0);
        element.querySelectorAll("[data-panel-image]").forEach((image, index) => {
          ScrollTrigger.create({ trigger: image, start: "top 50%", end: "bottom 50%", onToggle: (self) => { if (self.isActive) select(index); } });
        });
      }
      return () => {
        delete element.dataset.moving;
        element.querySelectorAll<HTMLElement>("[data-panel-content]").forEach((panel) => { panel.style.removeProperty("opacity"); panel.style.removeProperty("visibility"); panel.inert = false; });
      };
    });
    return () => media.revert();
  }, [kind]);
  return <div ref={root} className={className}>{children}</div>;
}
