import { BusFront, Users, ShieldCheck } from "lucide-react";
import { getSafeLinkHref } from "@/lib/safe-href";
import { SectionActions, type SectionProps } from "./maplewood-section";
import css from "./maplewood-home.module.css";
const icons = [BusFront, Users, ShieldCheck];
export default function BusMap({
  title,
  eyebrow,
  description,
  cards,
  embedUrl,
  actions,
  dataAttribute,
}: SectionProps<"busMap">) {
  const embed = getSafeLinkHref(embedUrl);
  const safeEmbed = embed?.startsWith("https://snazzymaps.com/embed/")
    ? embed
    : null;
  return (
    <section className={css.bus}>
      <div className={css.container}>
        <header className={css.busHeading}>
          {eyebrow ? (
            <p className={css.eyebrow} data-sanity={dataAttribute?.("eyebrow")}>
              {eyebrow}
            </p>
          ) : null}
          <h2 data-sanity={dataAttribute?.("title")}>{title}</h2>
          <p data-sanity={dataAttribute?.("description")}>{description}</p>
        </header>
        <div className={css.busGrid}>
          <div>
            <div className={css.benefits}>
              {cards?.map((card, i) => {
                const Icon = icons[i % icons.length];
                return (
                  <article
                    key={card._key}
                    data-sanity={dataAttribute?.(`cards[_key=="${card._key}"]`)}
                  >
                    <h3>
                      <Icon aria-hidden size={28} />
                      {card.title}
                    </h3>
                    <p>{card.description}</p>
                  </article>
                );
              })}
            </div>
            <SectionActions actions={actions} dataAttribute={dataAttribute} />
          </div>
          {safeEmbed ? (
            <iframe
              src={safeEmbed}
              title="Maplewood bus pickup locations"
              loading="lazy"
              className={css.map}
              data-sanity={dataAttribute?.("embedUrl")}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
