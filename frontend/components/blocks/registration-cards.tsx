import Link from "next/link";
import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  accentClass,
  type DataAttribute,
  innerCss as css,
  sectionBackground,
  SectionTagline,
  SourceActions,
  SourceCopy,
  SourceIcon,
  visibleActions,
} from "./maplewood-inner";
import about from "./maplewood-about.module.css";

type RegistrationCardsProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "registrationCards" }
> & { dataAttribute?: DataAttribute };

type Card = NonNullable<RegistrationCardsProps["cards"]>[number];

/** One link shows on its own line; several show as a list, as on the live page. */
function CardLinks({ card, dataAttribute }: { card: Card; dataAttribute?: DataAttribute }) {
  const links = visibleActions(card.links);
  if (!links.length) return null;
  const path = `cards[_key=="${card._key}"].links`;
  const item = (link: (typeof links)[number]) => (
    <Link
      className={css.inlineLink}
      data-sanity={dataAttribute?.(`${path}[_key=="${link._key}"]`)}
      href={link.href}
      rel={stegaClean(link.destination?.openInNewTab) ? "noopener noreferrer" : undefined}
      target={stegaClean(link.destination?.openInNewTab) ? "_blank" : undefined}
    >
      {link.label}
    </Link>
  );
  if (links.length === 1) return <p className={about.registrationLink}>{item(links[0])}</p>;
  return (
    <ul className={about.registrationLinks}>
      {links.map((link) => (
        <li key={link._key}>{item(link)}</li>
      ))}
    </ul>
  );
}

/*
 * Registration cards (Webflow blog66 heading over contact24 cards on
 * /contact): program label, icon and heading, introduction and tour button,
 * then cards with registration links. Links without a destination stay hidden.
 */
export default function RegistrationCards({
  _key,
  accent,
  actions,
  background,
  cards,
  dataAttribute,
  icon,
  intro,
  tagline,
  title,
}: RegistrationCardsProps) {
  if (!title) return null;
  const headingId = `registration-cards-${stegaClean(_key)}-title`;

  return (
    <section aria-labelledby={headingId} className={[css.section, sectionBackground(background, "white")].join(" ")}>
      <div className={css.container}>
        <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
        <div className={[about.registrationHeading, accentClass(accent)].join(" ")}>
          <SourceIcon dataSanity={dataAttribute?.("icon")} icon={icon} />
          <h2 className={css.h2} data-sanity={dataAttribute?.("title")} id={headingId}>
            {title}
          </h2>
        </div>
        <div className={about.registrationIndent}>
          <SourceCopy
            className={[css.medium, about.registrationIntro].join(" ")}
            dataSanity={dataAttribute?.("intro")}
            value={intro}
          />
          <SourceActions actions={actions} allOutline dataAttribute={dataAttribute} />
        </div>
        {cards?.length ? (
          <ul className={about.registrationCards}>
            {cards.map((card) => {
              const path = `cards[_key=="${card._key}"]`;
              return (
                <li
                  className={[about.registrationCard, accentClass(card.accent)].join(" ")}
                  data-sanity={dataAttribute?.(path)}
                  key={card._key}
                >
                  <SourceIcon dataSanity={dataAttribute?.(`${path}.icon`)} icon={card.icon} />
                  <h3 data-sanity={dataAttribute?.(`${path}.title`)}>{card.title}</h3>
                  <SourceCopy dataSanity={dataAttribute?.(`${path}.body`)} value={card.body} />
                  <CardLinks card={card} dataAttribute={dataAttribute} />
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
