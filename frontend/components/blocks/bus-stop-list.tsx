/*
 * The stop list under the bus map on the Free Bus Transportation page.
 * Folded closed by default. Towns come A to Z and stops by name, as the bus
 * map model sorts them. Each stop shows its name and address as plain text,
 * so a screen reader reads the list without the map.
 */
import type { BusTownGroup } from "@/lib/bus-map-model";
import css from "./maplewood-home.module.css";

export const STOP_LIST_SUMMARY = "Show the list of bus stops";
/** The heading for stops that have no town. */
export const NO_TOWN = "Other stops";

export default function BusStopList({ towns }: { towns: BusTownGroup[] }) {
  if (!towns.length) return null;
  const count = towns.reduce((total, town) => total + town.stops.length, 0);
  return (
    <details className={css.stopList}>
      <summary>
        {STOP_LIST_SUMMARY} ({count})
      </summary>
      <div className={css.stopTowns}>
        {towns.map(({ town, stops }) => (
          <section key={town || NO_TOWN}>
            <h3>{town || NO_TOWN}</h3>
            <ul>
              {stops.map((stop) => (
                <li key={stop.id}>
                  <strong>{stop.name}</strong>{" "}
                  {stop.address ? <span>{stop.address}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
