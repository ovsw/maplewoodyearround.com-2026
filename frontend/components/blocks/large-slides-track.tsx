"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./large-slides.module.css";

export type LargeSlideImage = Readonly<{
  alt: string;
  lqip?: string;
  /** Full-width source for the pinned desktop frame. */
  pinnedSrc: string;
  /** 3:2 crop for the stacked phone row. */
  stackedSrc: string;
  /** Hotspot as a CSS object-position, when the editor set one. */
  objectPosition?: string;
}>;

export type LargeSlide = Readonly<{
  key: string;
  labelId: string;
  textId: string;
  /** Two-digit slide number, e.g. "03". */
  number: string;
  /** Shown as written, e.g. "7:15 am"; empty when the slide has no time. */
  time: string;
  label: string;
  text: string;
  image: LargeSlideImage | null;
  /** Click-to-edit attributes, present only in draft mode. */
  sanity: Readonly<{
    image?: string;
    label?: string;
    text?: string;
    time?: string;
  }>;
}>;

type LargeSlidesTrackProps = Readonly<{
  slides: readonly LargeSlide[];
  dataSanity?: string;
}>;

/** Split a trailing am/pm off the written time so it can be set smaller. */
function splitTime(time: string) {
  const suffix = time.match(/\s*[ap]m\s*$/i)?.[0];
  return suffix ? [time.slice(0, -suffix.length), suffix] : [time, ""];
}

/*
 * Desktop: the photo frame pins and shows the photo of whichever slide
 * currently crosses the middle of the viewport. A single IntersectionObserver
 * with a one-pixel band at 50% viewport height reports which slide is there.
 * Phones never pin, so the observer only matters from the desktop breakpoint
 * where the pinned frame is visible; running it everywhere is harmless.
 */
export default function LargeSlidesTrack({
  dataSanity,
  slides,
}: LargeSlidesTrackProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  // Re-observe when slides are added, removed, or reordered, not only when
  // the count changes; a same-length replacement would otherwise keep
  // observing stale list items.
  const slideKeys = slides.map((slide) => slide.key).join("|");

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === "undefined") return;
    const items = Array.from(list.children) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = items.indexOf(entry.target as HTMLElement);
          if (index >= 0) setActiveIndex(index);
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [slideKeys]);

  return (
    <div className={styles.grid}>
      <div aria-hidden="true" className={styles.photo}>
        <div className={styles.frame}>
          {slides.map((slide, index) => (
            <div
              className={styles.layer}
              data-active={index === activeIndex ? "" : undefined}
              data-sanity={slide.sanity.image}
              key={slide.key}
            >
              {slide.image ? (
                <Image
                  alt={slide.image.alt}
                  blurDataURL={slide.image.lqip}
                  className="object-cover"
                  fill
                  placeholder={slide.image.lqip ? "blur" : undefined}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  src={slide.image.pinnedSrc}
                  style={
                    slide.image.objectPosition
                      ? { objectPosition: slide.image.objectPosition }
                      : undefined
                  }
                />
              ) : (
                <span className={styles.placeholderNumber}>{slide.number}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <ol
        aria-label="Slides, in order"
        className={cn("m-0 list-none p-0", styles.list)}
        data-sanity={dataSanity}
        ref={listRef}
        role="list"
      >
        {slides.map((slide) => {
          const [time, suffix] = splitTime(slide.time);
          return (
            <li
              aria-describedby={slide.textId}
              aria-labelledby={slide.labelId}
              className={styles.slide}
              key={slide.key}
            >
              <figure
                className={cn(
                  styles.stackedPhoto,
                  "relative m-0 aspect-[3/2] w-full overflow-hidden rounded-md bg-fill-panel shadow-media-rest",
                )}
                data-sanity={slide.sanity.image}
              >
                {slide.image ? (
                  <Image
                    alt={slide.image.alt}
                    blurDataURL={slide.image.lqip}
                    className="object-cover"
                    fill
                    loading="lazy"
                    placeholder={slide.image.lqip ? "blur" : undefined}
                    sizes="100vw"
                    src={slide.image.stackedSrc}
                  />
                ) : (
                  <span aria-hidden="true" className={styles.placeholderNumber}>
                    {slide.number}
                  </span>
                )}
              </figure>
              <div className="min-w-0">
                <p className="mb-3.5 text-step-number text-current/55">
                  {slide.number}
                </p>
                {time ? (
                  <p className={styles.time} data-sanity={slide.sanity.time}>
                    {time}
                    {suffix ? <small>{suffix}</small> : null}
                  </p>
                ) : null}
                <h3
                  className="max-w-[30rem] font-display text-[30px] leading-[1.1] font-bold tracking-[-0.01em] wrap-break-word"
                  data-sanity={slide.sanity.label}
                  id={slide.labelId}
                >
                  {slide.label}
                </h3>
                <p
                  className="mt-2.5 max-w-[30rem] text-pretty text-[15px] leading-[1.55] text-current/75 wrap-break-word"
                  data-sanity={slide.sanity.text}
                  id={slide.textId}
                >
                  {slide.text}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
