"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

/** Only the two source sections whose composition depends on scroll are animated. */
export default function HomeScrollMotion({
  kind,
  className,
  children,
}: {
  kind: "panels" | "reveal";
  className: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      () => {
        const element = root.current;
        if (!element) return;
        element.dataset.moving = "true";
        if (kind === "reveal") {
          const image = element.querySelector("[data-reveal-image]");
          gsap.fromTo(
            image,
            { width: "200%" },
            {
              width: "100%",
              duration: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: element,
                start: "top 50%",
                toggleActions: "play none none none",
              },
            },
          );
        } else {
          const panels = [
            ...element.querySelectorAll<HTMLElement>("[data-panel-content]"),
          ];
          const select = (index: number) =>
            panels.forEach((panel, i) => {
              panel.style.opacity = i === index ? "1" : "0";
              panel.style.visibility = i === index ? "visible" : "hidden";
              panel.inert = i !== index;
            });
          const images = [...element.querySelectorAll("[data-panel-image]")];
          const update = () => {
            const index = images.findIndex(
              (image) =>
                image.getBoundingClientRect().bottom > window.innerHeight / 2,
            );
            select(index === -1 ? panels.length - 1 : index);
          };
          update();
          ScrollTrigger.create({
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            onUpdate: update,
            onRefresh: update,
          });
        }
        return () => {
          delete element.dataset.moving;
          element
            .querySelectorAll<HTMLElement>("[data-panel-content]")
            .forEach((panel) => {
              panel.style.removeProperty("opacity");
              panel.style.removeProperty("visibility");
              panel.inert = false;
            });
        };
      },
    );
    return () => media.revert();
  }, [kind]);
  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
