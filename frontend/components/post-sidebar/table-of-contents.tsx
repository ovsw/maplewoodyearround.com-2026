"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { PostHeading } from "./model";

function flattenHeadings(headings: PostHeading[]): PostHeading[] {
  return headings.flatMap((heading) => [
    heading,
    ...flattenHeadings(heading.children),
  ]);
}

function HeadingLinks({
  activeId,
  headings,
}: {
  activeId: string | null;
  headings: PostHeading[];
}) {
  return (
    /* The shared left rule is the index's spine; the active item brightens its
       own segment of it, so the marker travels down the list as you read. */
    <ul className="space-y-1 border-l border-border">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            aria-current={activeId === heading.id ? "location" : undefined}
            className={cn(
              "-ml-px block border-l py-1 pl-4 text-sm leading-5 underline-offset-4 transition-colors motion-fast hover:text-foreground focus-underline",
              // Amber marks the current entry; it is never the text colour
              // (frontend/DESIGN.md, Amber-Is-Not-Text Rule).
              activeId === heading.id
                ? "border-primary font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:border-strong",
            )}
            href={`#${heading.id}`}
          >
            {heading.text}
          </a>
          {heading.children.length ? (
            <div className="pl-4">
              <HeadingLinks activeId={activeId} headings={heading.children} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function PostTableOfContents({ headings }: { headings: PostHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = flattenHeadings(headings).flatMap((heading) => {
      const element = document.getElementById(heading.id);
      return element ? [element] : [];
    });
    if (elements.length === 0 || !("IntersectionObserver" in window)) return;

    const updateActiveHeading = () => {
      const readingLine = window.innerHeight * 0.3;
      let nextActiveId: string | null = null;

      for (const element of elements) {
        if (element.getBoundingClientRect().top <= readingLine) {
          nextActiveId = element.id;
        } else {
          break;
        }
      }

      setActiveId(nextActiveId ?? elements[0]?.id ?? null);
    };
    const observer = new IntersectionObserver(updateActiveHeading, {
      rootMargin: "-20% 0px -70% 0px",
      threshold: [0, 1],
    });

    for (const element of elements) observer.observe(element);
    updateActiveHeading();

    return () => observer.disconnect();
  }, [headings]);

  return (
    <nav aria-label="Table of Contents">
      <HeadingLinks activeId={activeId} headings={headings} />
    </nav>
  );
}
