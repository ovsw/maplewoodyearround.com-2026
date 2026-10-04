import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  Breadcrumbs,
  type DataAttribute,
  HighlightedHeading,
  SourceButtons,
  SourceImage,
} from "./maplewood-inner";
import TabbedHeroTabs from "./tabbed-hero-tabs";
import styles from "./tabbed-hero.module.css";

type TabbedHeroProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "tabbedHero" }
> & { dataAttribute?: DataAttribute };

/*
 * School Year header (Webflow header103): one photo, heading and buttons per
 * tab. The client part switches tabs; this part renders their content.
 */
export default function TabbedHero({ _key, breadcrumbs, dataAttribute, tabs }: TabbedHeroProps) {
  const visible = (tabs ?? []).filter((tab) => stegaClean(tab.title)?.trim() && stegaClean(tab.label)?.trim());
  if (!visible.length) return null;
  const id = `tabbed-hero-${stegaClean(_key)}`;

  return (
    <TabbedHeroTabs
      id={id}
      images={visible.map((tab, index) => (
        <SourceImage
          className={styles.image}
          image={tab.image}
          key={tab._key}
          priority={index === 0}
          sizes="100vw"
          width={1920}
        />
      ))}
      panels={visible.map((tab, index) => {
        const path = `tabs[_key=="${tab._key}"]`;
        const Heading = index === 0 ? "h1" : "h2";
        return (
          <div className={styles.content} key={tab._key}>
            {index === 0 ? <Breadcrumbs breadcrumbs={breadcrumbs} dataAttribute={dataAttribute} /> : null}
            <Heading className={styles.title} data-sanity={dataAttribute?.(`${path}.title`)}>
              <HighlightedHeading className={styles.highlight} highlight={tab.highlightText} text={tab.title ?? ""} />
            </Heading>
            {stegaClean(tab.description)?.trim() ? (
              <p className={styles.text} data-sanity={dataAttribute?.(`${path}.description`)}>
                {tab.description}
              </p>
            ) : null}
            <SourceButtons
              buttons={tab.buttons}
              dataAttribute={dataAttribute}
              field={`${path}.buttons`}
              onDark
            />
          </div>
        );
      })}
      tabs={visible.map((tab) => ({
        key: tab._key,
        label: tab.label ?? "",
        dataSanity: dataAttribute?.(`tabs[_key=="${tab._key}"].label`),
      }))}
    />
  );
}
