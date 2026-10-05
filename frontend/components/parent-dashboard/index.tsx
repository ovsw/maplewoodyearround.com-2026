import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createDataAttribute, stegaClean } from "next-sanity";
import type { PARENT_DASHBOARD_QUERY_RESULT } from "@/sanity.types";
import {
  accentClass,
  innerCss as css,
  SectionTagline,
  SourceCopy,
  SourceIcon,
  SourceImage,
  visibleActions,
} from "@/components/blocks/maplewood-inner";
import { dataset, projectId } from "@/sanity/lib/env";
import ParentDashboardTabs from "./tabs";
import styles from "./parent-dashboard.module.css";

type Dashboard = NonNullable<PARENT_DASHBOARD_QUERY_RESULT>;
type Card = NonNullable<Dashboard["summerCampCards"]>[number];
type CardsField = "schoolYearCards" | "summerCampCards";

/*
 * The Parent dashboard (Webflow layout398): a centred heading, then one tab
 * of cards for each season. A card without a usable link stays hidden.
 */
export default function ParentDashboard({
  dashboard,
  stega,
}: {
  dashboard: Dashboard;
  stega?: boolean;
}) {
  const dataAttribute = (path: string) =>
    stega
      ? createDataAttribute({
          baseUrl: process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
          dataset,
          id: dashboard._id,
          path,
          projectId,
          type: dashboard._type,
        }).toString()
      : undefined;

  const tabs = [
    { key: "school-year", field: "schoolYearCards", labelField: "schoolYearLabel", fallback: "School Year" },
    { key: "summer-camp", field: "summerCampCards", labelField: "summerCampLabel", fallback: "Summer Camp" },
  ] as const;

  return (
    <section className={[css.section, css.cream, styles.section].join(" ")}>
      <div className={css.container}>
        <header className={styles.header}>
          <SectionTagline dataAttribute={dataAttribute} tagline={dashboard.tagline} />
          <h1 className={css.h2}>{dashboard.title}</h1>
          {dashboard.intro ? <p className={[css.medium, styles.muted].join(" ")}>{dashboard.intro}</p> : null}
          <SourceCopy
            className={[css.medium, styles.muted, styles.prompt].join(" ")}
            dataSanity={dataAttribute("tabsPrompt")}
            value={dashboard.tabsPrompt}
          />
        </header>
        <ParentDashboardTabs
          panels={tabs.map((tab) => (
            <DashboardCards
              cards={dashboard[tab.field]}
              dataAttribute={dataAttribute}
              field={tab.field}
              key={tab.key}
            />
          ))}
          tabs={tabs.map((tab) => ({
            key: tab.key,
            label: dashboard[tab.labelField] || tab.fallback,
            dataSanity: dataAttribute(tab.labelField),
          }))}
        />
      </div>
    </section>
  );
}

function DashboardCards({
  cards,
  dataAttribute,
  field,
}: {
  cards?: Card[] | null;
  dataAttribute: (path: string) => string | undefined;
  field: CardsField;
}) {
  const items = (cards ?? []).flatMap((card) => {
    const [link] = visibleActions(card.link ? [{ _key: card._key, ...card.link }] : []);
    return stegaClean(card.title)?.trim() && link ? [{ card, link }] : [];
  });
  if (!items.length) return null;

  return (
    <ul className={styles.cards}>
      {items.map(({ card, link }) => {
        const path = `${field}[_key=="${card._key}"]`;
        const newTab = stegaClean(link.destination?.openInNewTab);
        const hasImage = Boolean(card.image?.asset?._id);
        return (
          <li
            className={[css.cardSmall, styles.card, accentClass(card.accent)].join(" ")}
            data-sanity={dataAttribute(path)}
            key={card._key}
          >
            {hasImage ? (
              <SourceImage className={styles.image} image={card.image} sizes="(max-width: 767px) 90vw, 30vw" width={800} />
            ) : null}
            <div className={styles.content}>
              {hasImage ? null : (
                <SourceIcon className={styles.icon} dataSanity={dataAttribute(`${path}.icon`)} icon={card.icon} />
              )}
              <h2 className={[css.h4, styles.title].join(" ")}>{card.title}</h2>
              {card.text ? <p className={styles.text}>{card.text}</p> : null}
              <Link
                className={styles.link}
                data-sanity={dataAttribute(`${path}.link`)}
                href={link.href}
                rel={newTab ? "noopener noreferrer" : undefined}
                target={newTab ? "_blank" : undefined}
              >
                {link.label}
                <ChevronRight aria-hidden size={16} />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
