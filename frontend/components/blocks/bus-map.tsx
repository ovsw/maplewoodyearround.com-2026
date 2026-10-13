import { BusFront, Users, ShieldCheck } from "lucide-react";
import { stegaClean } from "next-sanity";
import { buildBusMapModel } from "@/lib/bus-map-model";
import BusStopMap from "./bus-stop-map";
import { SectionActions, type SectionProps } from "./maplewood-section";
import css from "./maplewood-home.module.css";
const icons = [BusFront, Users, ShieldCheck];
export default function BusMap({
  title,
  eyebrow,
  description,
  cards,
  stops,
  camp,
  actions,
  dataAttribute,
}: SectionProps<"busMap">) {
  // Popups show plain text: drop Presentation's hidden edit markers.
  const model = buildBusMapModel(stegaClean(stops), stegaClean(camp));
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
          <BusStopMap
            stops={model.stops}
            camp={model.camp}
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
          />
        </div>
      </div>
    </section>
  );
}
