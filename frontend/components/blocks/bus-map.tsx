import { BusFront, Users, ShieldCheck } from "lucide-react";
import { stegaClean } from "next-sanity";
import { buildBusMapModel } from "@/lib/bus-map-model";
import BusStopList from "./bus-stop-list";
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
  showStopList,
  stopList,
  dataAttribute,
}: SectionProps<"busMap">) {
  // Popups and the stop list show plain text: drop Presentation's hidden
  // edit markers.
  const model = buildBusMapModel(stegaClean(stops), stegaClean(camp));
  const withStopList = stegaClean(showStopList) === true;
  // The Bus page section has no cards or buttons: its map takes the width.
  const mapOnly = !cards?.length && !actions?.length;
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
        <div
          className={[css.busGrid, mapOnly ? css.busGridMapOnly : ""].join(" ")}
        >
          {mapOnly ? null : (
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
          )}
          <BusStopMap
            stops={model.stops}
            camp={model.camp}
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
            // The list sits under this map; elsewhere the message links to it.
            stopListHref={withStopList ? null : stegaClean(stopList?.href)}
          />
        </div>
        {withStopList ? <BusStopList towns={model.towns} /> : null}
      </div>
    </section>
  );
}
