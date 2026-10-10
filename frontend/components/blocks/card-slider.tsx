import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
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
  SourceCopy,
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

type Item = NonNullable<CardSliderProps["items"]>[number];
type Schedule = NonNullable<CardSliderProps["schedule"]>;

// A calendar date such as "Sat. Oct 3". Dates are stored as calendar days.
const dayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** A Play Center calendar day: its guest and character, or its own agenda. */
function CalendarDay({
  item,
  characterTime,
  itemDataAttribute,
}: {
  item: Item;
  characterTime?: string | null;
  itemDataAttribute?: CardSliderProps["itemDataAttribute"];
}) {
  const edit = (path: string) => itemDataAttribute?.(item._id, item._type, path);
  const guest = stegaClean(item.hasGuest) === true ? item.guest : null;
  const photos = [guest?.image, item.character?.image].filter((image) => image?.asset?._id);
  const date = stegaClean(item.date);
  const day = [stegaClean(item.dayLabel)?.trim(), date ? dayFormat.format(new Date(date)) : null]
    .filter(Boolean)
    .join(". ");
  const time = stegaClean(characterTime)?.trim();
  return (
    <>
      <div className={[css.cardSmall, css.sliderImage, programs.calendarPhotos].join(" ")} data-sanity={edit("guest")}>
        {photos.map((image, index) => (
          <SourceImage image={image} key={index} sizes="(max-width: 767px) 40vw, 10rem" width={480} />
        ))}
      </div>
      <div className={programs.calendarDay}>
        <CalendarDays aria-hidden className={programs.calendarIcon} size={40} />
        <div>
          <h3 className={css.h6} data-sanity={edit("date")}>
            {day}
          </h3>
          {stegaClean(item.customDay) === true ? (
            <SourceCopy className={programs.calendarAgenda} dataSanity={edit("agenda")} value={item.agenda} />
          ) : (
            <ul className={programs.calendarLines}>
              {item.character?.title ? (
                <li data-sanity={edit("character")}>
                  {item.character.title}
                  {time ? ` – ${time}` : null}
                </li>
              ) : null}
              {guest?.title ? (
                <li data-sanity={edit("guest")}>
                  {guest.title}
                  {stegaClean(guest.time)?.trim() ? ` – ${guest.time}` : null}
                </li>
              ) : null}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

/** The slots of a Sample schedule, each named by its time with its label as heading. */
function ScheduleSlots({
  schedule,
  itemDataAttribute,
}: {
  schedule: Schedule;
  itemDataAttribute?: CardSliderProps["itemDataAttribute"];
}) {
  const slots = (schedule.slots ?? []).filter((slot) => stegaClean(slot.label)?.trim());
  return slots.map((slot) => {
    const edit = (field: string) =>
      itemDataAttribute?.(schedule._id, schedule._type, `slots[_key=="${slot._key}"].${field}`);
    return (
      <li className={css.sliderCard} key={slot._key}>
        <div className={[css.cardSmall, css.sliderImage].join(" ")} data-sanity={edit("image")}>
          <SourceImage image={slot.image} sizes="(max-width: 767px) 80vw, 20rem" width={640} />
        </div>
        <div className={css.sliderCardText}>
          <p className={programs.time} data-sanity={edit("time")}>
            <Clock aria-hidden size={20} />
            {slot.time}
          </p>
          <h3 className={css.h6} data-sanity={edit("label")}>
            {slot.label}
          </h3>
          {slot.description ? <p data-sanity={edit("description")}>{slot.description}</p> : null}
        </div>
      </li>
    );
  });
}

/** Collection cards in a slider (Webflow blog66), such as one facility category. */
export default function CardSlider({
  _key,
  accent,
  actions,
  background,
  calendar,
  characterTime,
  dataAttribute,
  description,
  icon,
  itemDataAttribute,
  items,
  schedule,
  source,
  tagline,
  title,
}: CardSliderProps) {
  const cards = (items ?? []).filter(
    (item) => stegaClean(item.title)?.trim() || item._type === "playgroundEvent",
  );
  const slotCount = (schedule?.slots ?? []).filter((slot) => stegaClean(slot.label)?.trim()).length;
  const count = schedule ? slotCount : cards.length;
  if (!title || !count) return null;
  const headingId = `card-slider-${stegaClean(_key)}-title`;
  // The calendar shows its buttons below the days, as live.
  const calendarDays = stegaClean(source) === "playgroundEvent";
  const calendarUrl = calendarDays ? stegaClean(calendar?.fileUrl) : undefined;
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
              <p
                className={[css.medium, css.sliderDescription, stegaClean(icon?.svg) ? css.sliderIndent : ""].join(" ")}
                data-sanity={dataAttribute?.("description")}
              >
                {description}
              </p>
            ) : null}
            {calendarUrl && calendar?.title ? (
              <p className={programs.calendarFile}>
                <Link className={css.inlineLink} href={calendarUrl} rel="noopener noreferrer" target="_blank">
                  {calendar.title}
                </Link>
              </p>
            ) : null}
          </div>
          {calendarDays ? null : <SourceActions actions={actions} allOutline dataAttribute={dataAttribute} />}
        </div>
        <CardSliderTrack count={count} label={stegaClean(title) ?? "Cards"}>
          {schedule ? <ScheduleSlots itemDataAttribute={itemDataAttribute} schedule={schedule} /> : cards.map((item) => item._type === "playgroundEvent" ? (
            <li className={css.sliderCard} key={item._id}>
              <CalendarDay characterTime={characterTime} item={item} itemDataAttribute={itemDataAttribute} />
            </li>
          ) : (
            <li className={css.sliderCard} key={item._id}>
              <div
                className={[css.cardSmall, css.sliderImage].join(" ")}
                data-sanity={itemDataAttribute?.(item._id, item._type, "image")}
              >
                <SourceImage image={item.image} sizes="(max-width: 767px) 80vw, 20rem" width={640} />
              </div>
              <div className={css.sliderCardText}>
                <h3 className={css.h6} data-sanity={itemDataAttribute?.(item._id, item._type, "title")}>
                  {item.title}
                </h3>
                {item.description ? (
                  <p data-sanity={itemDataAttribute?.(item._id, item._type, "description")}>{item.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </CardSliderTrack>
        {calendarDays ? (
          <div className={programs.calendarActions}>
            <SourceActions actions={actions} allOutline dataAttribute={dataAttribute} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
