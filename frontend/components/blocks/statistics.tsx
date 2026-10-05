import { PortableText } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import {
  accentClass,
  type DataAttribute,
  innerCss as css,
  sectionBackground,
  SectionTagline,
  SourceActions,
  SourceCopy,
  SourceImage,
} from "./maplewood-inner";
import about from "./maplewood-about.module.css";
import { RosterGrid } from "./staff-roster";
import styles from "./statistics.module.css";

type StatisticsProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "statistics" }
> & {
  dataAttribute?: DataAttribute;
  memberDataAttribute?: (documentId: string, path: string) => string | undefined;
};

/*
 * Figures beside a story (Webflow stats14), such as the preschool's staff
 * experience, optionally followed by the preschool teachers' portraits.
 */
export default function Statistics({
  _key,
  actions,
  background,
  dataAttribute,
  description,
  image,
  items,
  memberDataAttribute,
  members,
  tagline,
  text,
  title,
}: StatisticsProps) {
  if (!title) return null;
  const headingId = `statistics-${stegaClean(_key)}-title`;
  const team = (members ?? []).filter((member) => member.document);

  // With a photo (the /history figures), the figures come first, then the
  // heading and text beside the photo.
  if (image?.asset?._id) {
    return (
      <section aria-labelledby={headingId} className={[css.section, sectionBackground(background, "white")].join(" ")}>
        <div className={css.container}>
          {items?.length ? (
            <ul className={about.statsList}>
              {items.map((item) => (
                <li
                  className={[about.statsItem, accentClass(item.accent)].join(" ")}
                  data-sanity={dataAttribute?.(`items[_key=="${item._key}"]`)}
                  key={item._key}
                >
                  <p className={about.statsValue}>{item.value}</p>
                  {item.label ? <h3 className={about.statsLabel}>{item.label}</h3> : null}
                </li>
              ))}
            </ul>
          ) : null}
          <div className={about.statsContent}>
            <div>
              <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
              <h2 className={css.h2} data-sanity={dataAttribute?.("title")} id={headingId}>
                {title}
              </h2>
              <SourceCopy className={[css.medium, styles.text].join(" ")} dataSanity={dataAttribute?.("text")} value={text} />
              <div className={styles.text}>
                <SourceActions actions={actions} allOutline dataAttribute={dataAttribute} />
              </div>
            </div>
            <div className={[css.cardSmall, about.statsPhoto].join(" ")} data-sanity={dataAttribute?.("image")}>
              <SourceImage image={image} sizes="(max-width: 991px) 90vw, 600px" width={1200} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId} className={[css.section, sectionBackground(background, "cream")].join(" ")}>
      <div className={css.container}>
        <div className={styles.layout}>
          <div>
            <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
            <h2 className={css.h2} data-sanity={dataAttribute?.("title")} id={headingId}>
              {title}
            </h2>
            {stegaClean(description)?.trim() ? (
              <p className={[css.medium, styles.text].join(" ")} data-sanity={dataAttribute?.("description")}>
                {description}
              </p>
            ) : null}
            <SourceCopy className={[css.medium, styles.text].join(" ")} dataSanity={dataAttribute?.("text")} value={text} />
            <div className={styles.text}>
              <SourceActions actions={actions} allOutline dataAttribute={dataAttribute} />
            </div>
          </div>
          {items?.length ? (
            <ul className={styles.items}>
              {items.map((item) => (
                <li
                  className={[styles.item, accentClass(item.accent)].join(" ")}
                  data-sanity={dataAttribute?.(`items[_key=="${item._key}"]`)}
                  key={item._key}
                >
                  <p className={styles.value}>{item.value}</p>
                  {item.label ? <h3 className={[css.h6, styles.label].join(" ")}>{item.label}</h3> : null}
                  {item.text?.length ? (
                    <div className={css.copy}>
                      <PortableText components={simpleRichTextComponents} value={item.text} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {team.length ? (
          <div className={styles.team}>
            <RosterGrid memberDataAttribute={memberDataAttribute} members={team} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
