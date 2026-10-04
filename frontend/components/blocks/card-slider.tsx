import { Clock } from "lucide-react";
import { stegaClean } from "next-sanity";
import programs from "./maplewood-programs.module.css";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import CardSliderTrack from "./card-slider-track";
import {
  accentClass,
  type DataAttribute,
  innerCss as css,
  SectionTagline,
  SourceActions,
  SourceIcon,
  SourceImage,
} from "./maplewood-inner";

type CardSliderProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "cardSlider" }
> & {
  dataAttribute?: DataAttribute;
  itemDataAttribute?: (documentId: string, documentType: string, path: string) => string | undefined;
};

/** Collection cards in a slider (Webflow blog66), such as one facility category. */
export default function CardSlider({
  _key,
  accent,
  actions,
  background,
  dataAttribute,
  description,
  icon,
  itemDataAttribute,
  items,
  tagline,
  title,
}: CardSliderProps) {
  const cards = (items ?? []).filter((item) => stegaClean(item.title)?.trim());
  if (!title || !cards.length) return null;
  const headingId = `card-slider-${stegaClean(_key)}-title`;
  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, css.sectionSmall, stegaClean(background) === "cream" ? css.cream : css.white].join(" ")}
    >
      <div className={css.container}>
        <div className={css.sliderHeading}>
          <div className={css.sliderIntro}>
            <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
            <div className={[css.sliderTitle, accentClass(accent)].join(" ")}>
              <SourceIcon dataSanity={dataAttribute?.("icon")} icon={icon} />
              <h2 className={css.h2} data-sanity={dataAttribute?.("title")} id={headingId}>
                {title}
              </h2>
            </div>
            {stegaClean(description)?.trim() ? (
              <p className={[css.medium, css.sliderDescription].join(" ")} data-sanity={dataAttribute?.("description")}>
                {description}
              </p>
            ) : null}
          </div>
          <SourceActions actions={actions} allOutline dataAttribute={dataAttribute} />
        </div>
        <CardSliderTrack count={cards.length} label={stegaClean(title) ?? "Cards"}>
          {cards.map((item) => (
            <li className={css.sliderCard} key={item._id}>
              <div
                className={[css.cardSmall, css.sliderImage].join(" ")}
                data-sanity={itemDataAttribute?.(item._id, item._type, "image")}
              >
                <SourceImage image={item.image} sizes="(max-width: 767px) 80vw, 20rem" width={640} />
              </div>
              <div className={css.sliderCardText}>
                {item._type === "sampleSchedule" ? (
                  // A sample schedule entry is named by its time; the activity is its heading.
                  <>
                    <p className={programs.time} data-sanity={itemDataAttribute?.(item._id, item._type, "title")}>
                      <Clock aria-hidden size={20} />
                      {item.title}
                    </p>
                    <h3 className={css.h6} data-sanity={itemDataAttribute?.(item._id, item._type, "activity")}>
                      {item.activity}
                    </h3>
                  </>
                ) : (
                  <h3 className={css.h6} data-sanity={itemDataAttribute?.(item._id, item._type, "title")}>
                    {item.title}
                  </h3>
                )}
                {item.description ? (
                  <p data-sanity={itemDataAttribute?.(item._id, item._type, "description")}>{item.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </CardSliderTrack>
      </div>
    </section>
  );
}
