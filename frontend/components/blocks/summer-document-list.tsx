import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import {
  type DataAttribute,
  innerCss as css,
  sectionBackground,
} from "./maplewood-inner";
import styles from "./summer-document-list.module.css";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type SummerDocumentListProps = Extract<
  PageBlock,
  { _type: "summerDocumentList" }
> & {
  dataAttribute?: DataAttribute;
  itemDataAttribute?: (
    documentId: string,
    documentType: string,
    path: string,
  ) => string | undefined;
};

/** The live site's download glyph (Material "file download"). */
function DownloadIcon() {
  return (
    <svg aria-hidden="true" className={styles.icon} viewBox="0 0 24 24">
      <path
        d="M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3h-2zm-1-4l-1.41-1.41L13 12.17V4h-2v8.17L8.41 9.59L7 11l5 5l5-5z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Every visible Camp group's PDF of one kind, listed under each grade heading. */
export default function SummerDocumentList({
  _key,
  background,
  dataAttribute,
  description,
  grades,
  itemDataAttribute,
  kind,
  season,
}: SummerDocumentListProps) {
  if (!grades?.length) return null;

  const sectionKey = stegaClean(_key);
  const fileField = stegaClean(kind) === "welcomeLetter" ? "welcomeLetter" : "groupSchedule";

  return (
    <section
      aria-label={stegaClean(season) || undefined}
      className={[css.section, css.sectionMedium, sectionBackground(background)].join(" ")}
    >
      <div className={css.narrow}>
        {description ? (
          <p className={styles.intro} data-sanity={dataAttribute?.("description")}>
            {description}
          </p>
        ) : null}
        {grades.map((grade) => {
          const headingId = `summer-documents-${sectionKey}-${stegaClean(grade._id)}`;
          return (
            <div className={styles.grade} key={grade._id}>
              <h2 className={styles.heading} id={headingId}>
                {grade.title}:
              </h2>
              <ul aria-labelledby={headingId} className={styles.list}>
                {grade.groups.map((group) => (
                  <li className={styles.item} key={group._id}>
                    <a
                      className={styles.link}
                      data-sanity={itemDataAttribute?.(group._id, "campGroup", fileField)}
                      href={group.fileUrl ?? undefined}
                    >
                      {group.title}
                      <span className="sr-only"> (PDF)</span>
                    </a>
                    <DownloadIcon />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
