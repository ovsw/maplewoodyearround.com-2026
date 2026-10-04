import { PortableText } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  type DataAttribute,
  innerCss as css,
  sectionBackground,
  SourceButtons,
  SourceImage,
} from "./maplewood-inner";
import programs from "./maplewood-programs.module.css";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type StackedTimelineProps = Extract<PageBlock, { _type: "stackedTimeline" }> & {
  dataAttribute?: DataAttribute;
};

type TimelineItem = NonNullable<StackedTimelineProps["items"]>[number];

const hasText = (value?: string | null) => Boolean(stegaClean(value)?.trim());

/** Steps the renderer can show: each needs a title and its line of text. */
export function getRenderableItems(items: StackedTimelineProps["items"]) {
  return (items ?? []).filter(
    (item): item is TimelineItem => Boolean(item?._key) && hasText(item.title) && hasText(item.text),
  );
}

/*
 * Timeline (Webflow summer-camp_timeline): a sticky intro beside ordered
 * steps on a vertical line. The live scroll-filled line is decorative, so
 * the line is drawn static.
 */
export default function StackedTimeline({
  _key,
  background,
  buttons,
  dataAttribute,
  eyebrow,
  intro,
  items,
  title,
}: StackedTimelineProps) {
  const steps = getRenderableItems(items);
  if (!title?.length || steps.length < 2) return null;
  const headingId = `stacked-timeline-${stegaClean(_key)}-title`;

  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, sectionBackground(background, "cream")].join(" ")}
    >
      <div className={[css.container, programs.timeline].join(" ")}>
        <div className={programs.timelineIntro}>
          {hasText(eyebrow) ? (
            <p className={css.tagline} data-sanity={dataAttribute?.("eyebrow")}>
              {eyebrow}
            </p>
          ) : null}
          <h2 className={css.h2} data-sanity={dataAttribute?.("title")} id={headingId}>
            <PortableText components={{ block: { normal: ({ children }) => <>{children}</> } }} value={title} />
          </h2>
          {hasText(intro) ? (
            <p className={css.medium} data-sanity={dataAttribute?.("intro")}>
              {intro}
            </p>
          ) : null}
          <div className={css.storyButtons}>
            <SourceButtons buttons={buttons} dataAttribute={dataAttribute} />
          </div>
        </div>
        <ol aria-label="Steps, in order" className={programs.timelineSteps} data-sanity={dataAttribute?.("items")}>
          {steps.map((step) => {
            const path = `items[_key=="${step._key}"]`;
            return (
              <li className={programs.timelineStep} data-sanity={dataAttribute?.(path)} key={step._key}>
                {hasText(step.meta) ? (
                  <p className={programs.stepLabel} data-sanity={dataAttribute?.(`${path}.meta`)}>
                    {step.meta}
                  </p>
                ) : null}
                {step.image?.asset?._id ? (
                  <div className={[css.cardSmall, programs.columnImage].join(" ")}>
                    <SourceImage image={step.image} sizes="(max-width: 767px) 90vw, 40vw" width={800} />
                  </div>
                ) : null}
                <h3 className={css.h5} data-sanity={dataAttribute?.(`${path}.title`)}>
                  {step.title}
                </h3>
                <p data-sanity={dataAttribute?.(`${path}.text`)}>{step.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
