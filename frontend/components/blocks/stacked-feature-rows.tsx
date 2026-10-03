import { NavigationIcon } from "@/components/header/navigation-icon";
import { createCustomLinkMarkRenderer } from "@/components/portable-text/custom-link-mark";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import { getSafeLinkHref } from "@/lib/safe-href";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  PortableText,
  toPlainText,
  type PortableTextComponents,
} from "@portabletext/react";
import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import styles from "./stacked-feature-rows.module.css";
import { sectionThemeClass } from "./section-theme";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type StackedFeatureRowsProps = Extract<
  PageBlock,
  { _type: "stackedFeatureRows" }
> & {
  dataAttribute?: (path: string) => string | undefined;
};

const headingComponents: PortableTextComponents = {
  block: { normal: ({ children }) => <>{children}</> },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => (
      <em className="font-accent text-emphasis not-italic">
        {children}
      </em>
    ),
  },
};

const rowItemComponents: PortableTextComponents = {
  ...simpleRichTextComponents,
  marks: {
    ...simpleRichTextComponents?.marks,
    customLink: createCustomLinkMarkRenderer(
      "font-medium text-link underline decoration-current/30 underline-offset-4 hover:opacity-75",
    ),
  },
};

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

export default function StackedFeatureRows({
  _key,
  background,
  dataAttribute,
  eyebrow,
  rows,
  title,
}: StackedFeatureRowsProps) {
  if (!title?.length || !rows?.length) return null;

  const renderableRows = rows.flatMap((row) => {
    const items = (row.items ?? []).filter(
      (item) => item.body?.length && hasText(toPlainText(item.body)),
    );

    if (!hasText(row.title) || !items.length) return [];

    // The link is optional: a row renders without one, but never with a
    // half-filled one.
    const href = getSafeLinkHref(row.link?.href);
    const link = hasText(row.link?.text) && href ? { ...row.link, href } : null;

    return [{ items, link, row }];
  });

  if (!renderableRows.length) return null;

  const headingId = `stacked-feature-rows-${stegaClean(_key)}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`py-section ${sectionThemeClass(background)}`}
      id={`stacked-features-${stegaClean(_key)}`}
    >
      <div className="container-content">
        <header className="grid max-w-4xl gap-4">
          {hasText(eyebrow) ? (
            <p
              className="text-eyebrow text-current/70"
              data-sanity={dataAttribute?.("eyebrow")}
            >
              {eyebrow}
            </p>
          ) : null}

          <h2
            className="text-balance font-display text-headline"
            data-sanity={dataAttribute?.("title")}
            id={headingId}
          >
            <PortableText components={headingComponents} value={title} />
          </h2>
        </header>

        <ol
          className="mt-8 grid list-none divide-y divide-current/20 border-y border-current/20 p-0 md:mt-10"
          data-sanity={dataAttribute?.("rows")}
        >
          {renderableRows.map(({ items, link, row }) => {
            const rowPath = `rows[_key=="${row._key}"]`;
            const iconName = stegaClean(row.icon?.name)?.trim();
            const iconSvg = stegaClean(row.icon?.svg)?.trim() || null;

            return (
              <li
                className={`grid gap-5 py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-start md:gap-10 md:py-8 lg:gap-16 ${styles.reveal}`}
                key={row._key}
              >
                <div className="flex min-w-0 items-start gap-3">
                  {iconName && iconSvg ? (
                    <span
                      aria-hidden="true"
                      className="mt-1 flex size-6 shrink-0 items-center justify-center text-link [&_svg]:size-6"
                      data-sanity={dataAttribute?.(`${rowPath}.icon`)}
                    >
                      <NavigationIcon icon={{ name: iconName, svg: iconSvg }} />
                    </span>
                  ) : null}
                  <h3
                    className="min-w-0 font-display text-title-lg wrap-break-word"
                    data-sanity={dataAttribute?.(`${rowPath}.title`)}
                  >
                    {row.title}
                  </h3>
                </div>

                <div className="min-w-0 max-w-prose">
                  <ul
                    className="grid list-none gap-4 p-0 leading-relaxed"
                    data-sanity={dataAttribute?.(`${rowPath}.items`)}
                  >
                    {items.map((item) => {
                      const itemPath = `${rowPath}.items[_key=="${item._key}"]`;

                      return (
                        <li className="flex items-start gap-3" key={item._key}>
                          <Check
                            aria-hidden="true"
                            className="mt-0.5 size-5 shrink-0 text-link"
                          />
                          <div
                            className="grid min-w-0 gap-2 wrap-break-word"
                            data-sanity={dataAttribute?.(`${itemPath}.body`)}
                          >
                            <PortableText
                              components={rowItemComponents}
                              value={item.body}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {link ? (
                    <Link
                      className="focus-ring mt-6 ms-8 inline-flex w-fit items-center gap-2 font-semibold text-link hover:opacity-75"
                      data-sanity={dataAttribute?.(`${rowPath}.link`)}
                      href={link.href}
                      rel={
                        stegaClean(link.openInNewTab)
                          ? "noopener noreferrer"
                          : undefined
                      }
                      target={
                        stegaClean(link.openInNewTab) ? "_blank" : undefined
                      }
                    >
                      <span
                        data-sanity={dataAttribute?.(`${rowPath}.link.text`)}
                      >
                        {link.text}
                      </span>
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
