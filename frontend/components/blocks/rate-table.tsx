import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  type DataAttribute,
  innerCss as css,
  SectionTagline,
  SourceActions,
  SourceCopy,
  SourceImage,
} from "./maplewood-inner";

type RateTableProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "rateTable" }
> & { dataAttribute?: DataAttribute };

/*
 * Dates and rates table (Webflow comparison6 / comparison8): photo column
 * headings and alternating yellow rows. Tables with three price columns
 * stack each row on phones, with the column name above each price.
 */
export default function RateTable({
  _key,
  actions,
  background,
  columns,
  dataAttribute,
  intro,
  notes,
  rows,
  tagline,
  title,
}: RateTableProps) {
  if (!title || !columns?.length) return null;
  const headingId = `rate-table-${stegaClean(_key)}-title`;
  const [rowHeading, ...valueColumns] = columns;
  const stacked = valueColumns.length > 2;
  const template = { "--rate-columns": valueColumns.length } as React.CSSProperties;

  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, stegaClean(background) === "cream" ? css.cream : css.white].join(" ")}
    >
      <div className={css.container}>
        <div className={[css.narrow, css.centerText].join(" ")}>
          <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
          <h2 className={css.h2} data-sanity={dataAttribute?.("title")} id={headingId}>
            {title}
          </h2>
          <SourceCopy
            className={[css.medium, css.rateIntro].join(" ")}
            dataSanity={dataAttribute?.("intro")}
            value={intro}
          />
        </div>
        <div
          aria-labelledby={headingId}
          className={[css.rateTable, stacked ? css.rateStacked : ""].join(" ")}
          data-sanity={dataAttribute?.("columns")}
          role="table"
          style={template}
        >
          <div className={css.rateHead} role="row">
            <div className={[css.rateHeadTitle, css.h6].join(" ")} role="columnheader">
              {rowHeading.label}
            </div>
            {valueColumns.map((column) => (
              <div className={css.rateHeadCell} key={column._key} role="columnheader">
                {column.image?.asset?._id ? (
                  <div className={[css.cardSmall, css.rateImage].join(" ")}>
                    <SourceImage image={column.image} sizes="10rem" width={320} />
                  </div>
                ) : null}
                <span className={css.h6}>{column.label}</span>
                {column.note ? <span className={css.rateNote}>{column.note}</span> : null}
                {column.detail ? <span className={css.rateDetail}>{column.detail}</span> : null}
              </div>
            ))}
          </div>
          {rows?.map((row) => (
            <div
              className={css.rateRow}
              data-sanity={dataAttribute?.(`rows[_key=="${row._key}"]`)}
              key={row._key}
              role="row"
            >
              <div className={css.rateLabel} role="rowheader">
                {row.label}
              </div>
              {valueColumns.map((column, index) => (
                <div className={css.rateCell} key={column._key} role="cell">
                  {stacked ? (
                    <span aria-hidden="true" className={css.rateCellLabel}>
                      {column.label}:
                    </span>
                  ) : null}
                  <span>{row.cells?.[index]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        {notes?.length || actions?.length ? (
          <div className={css.rateClosing}>
            <SourceCopy
              className={css.rateNotes}
              dataSanity={dataAttribute?.("notes")}
              value={notes}
            />
            <SourceActions actions={actions} center dataAttribute={dataAttribute} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
