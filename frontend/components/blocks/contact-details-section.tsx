import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  accentClass,
  type DataAttribute,
  innerCss as css,
  sectionBackground,
  SourceCopy,
  SourceIcon,
} from "./maplewood-inner";
import about from "./maplewood-about.module.css";

type ContactDetailsSectionProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "contactDetailsSection" }
> & { dataAttribute?: DataAttribute };

/*
 * Contact cards (Webflow contact21): a coloured icon, heading and the
 * email, telephone or address links, three across.
 */
export default function ContactDetailsSection({
  _key,
  background,
  dataAttribute,
  features,
}: ContactDetailsSectionProps) {
  const cards = (features ?? []).filter((card) => stegaClean(card.title)?.trim());
  if (!cards.length) return null;

  return (
    <section
      aria-label="Contact details"
      className={[css.section, sectionBackground(background, "cream")].join(" ")}
      id={`contact-details-${stegaClean(_key)}`}
    >
      <ul className={[css.container, about.contactCards].join(" ")}>
        {cards.map((card) => {
          const path = `features[_key=="${card._key}"]`;
          return (
            <li className={accentClass(card.accent)} data-sanity={dataAttribute?.(path)} key={card._key}>
              <SourceIcon className={about.contactIcon} dataSanity={dataAttribute?.(`${path}.icon`)} icon={card.icon} />
              <h2 className={about.contactTitle} data-sanity={dataAttribute?.(`${path}.title`)}>
                {card.title}
              </h2>
              <SourceCopy dataSanity={dataAttribute?.(`${path}.body`)} value={card.body} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
