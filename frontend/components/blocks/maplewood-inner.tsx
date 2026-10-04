import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PortableText, type PortableTextProps } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import { createCustomLinkMarkRenderer } from "@/components/portable-text/custom-link-mark";
import { isSafeIconSvg } from "@/components/header/safe-icon-svg";
import { getSafeLinkHref } from "@/lib/safe-href";
import { urlFor } from "@/sanity/lib/image";
import css from "./maplewood-inner.module.css";

/*
 * Shared pieces of the inner-page sections, ported from the live Webflow
 * components (labels, buttons, icon points and copy). Sections own layout.
 */

export type DataAttribute = (path: string) => string | undefined;

type Tagline = {
  label?: string | null;
  program?: string | null;
  text?: string | null;
} | null;

export function SectionTagline({
  tagline,
  dataAttribute,
  className,
}: {
  tagline?: Tagline;
  dataAttribute?: DataAttribute;
  className?: string;
}) {
  const label = stegaClean(tagline?.label)?.trim();
  const text = stegaClean(tagline?.text)?.trim();
  if (!label && !text) return null;
  const badge =
    stegaClean(tagline?.program) === "schoolYear" ? css.badgeSchool : css.badgeSummer;
  return (
    <p
      className={[css.tagline, className].filter(Boolean).join(" ")}
      data-sanity={dataAttribute?.("tagline")}
    >
      {label ? <span className={badge}>{tagline?.label}</span> : null}
      {label && text ? " – " : null}
      {text ? <span>{tagline?.text}</span> : null}
    </p>
  );
}

export const accentClass = (accent?: string | null) =>
  css[`accent-${stegaClean(accent) || "green"}`] ?? css["accent-green"];

export function SourceIcon({
  icon,
  className,
}: {
  icon?: { svg?: string | null } | null;
  className?: string;
}) {
  const svg = stegaClean(icon?.svg)?.trim();
  if (!svg || !isSafeIconSvg(svg)) return null;
  return (
    <span
      aria-hidden="true"
      className={[css.icon, className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

type SourceButton = {
  _key: string;
  text?: string | null;
  variant?: string | null;
  href?: string | null;
  openInNewTab?: boolean | null;
};

type SourceAction = {
  _key: string;
  label?: string | null;
  destination?: { href?: string | null; openInNewTab?: boolean | null } | null;
};

// A button without a usable destination stays hidden until an editor adds one.
const usableHref = (value?: string | null) => {
  const href = getSafeLinkHref(value);
  return href && href !== "#" ? href : null;
};

function ButtonLink({
  href,
  label,
  variant,
  openInNewTab,
  onDark,
  dataSanity,
}: {
  href: string;
  label: React.ReactNode;
  variant: string;
  openInNewTab?: boolean;
  onDark?: boolean;
  dataSanity?: string;
}) {
  const style =
    variant === "link"
      ? css.buttonLink
      : variant === "outline" || variant === "secondary"
        ? css.buttonSecondary
        : css.buttonPrimary;
  return (
    <Link
      className={[css.button, style, onDark ? css.onDark : ""].join(" ")}
      data-sanity={dataSanity}
      href={href}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      target={openInNewTab ? "_blank" : undefined}
    >
      <span>{label}</span>
      {variant === "link" ? null : <ChevronRight aria-hidden size={16} />}
    </Link>
  );
}

/** Webflow `button` objects. Link-style buttons are separated by bullets. */
export function SourceButtons({
  buttons,
  dataAttribute,
  field = "buttons",
  onDark,
  center,
}: {
  buttons?: SourceButton[] | null;
  dataAttribute?: DataAttribute;
  field?: string;
  onDark?: boolean;
  center?: boolean;
}) {
  const visible = (buttons ?? []).flatMap((button) => {
    const href = usableHref(button.href);
    const label = stegaClean(button.text)?.trim();
    return href && label ? [{ ...button, href }] : [];
  });
  if (!visible.length) return null;
  return (
    <div className={[css.buttonGroup, center ? css.center : ""].join(" ")}>
      {visible.map((button, index) => {
        const variant = stegaClean(button.variant) || "default";
        return (
          <span className={css.buttonItem} key={button._key}>
            {index > 0 && variant === "link" ? (
              <span aria-hidden="true" className={css.separator}>
                •
              </span>
            ) : null}
            <ButtonLink
              dataSanity={dataAttribute?.(`${field}[_key=="${button._key}"]`)}
              href={button.href}
              label={button.text}
              onDark={onDark}
              openInNewTab={stegaClean(button.openInNewTab) === true}
              variant={variant}
            />
          </span>
        );
      })}
    </div>
  );
}

/** Maplewood `contentAction` objects: the first is primary, others outline. */
export function SourceActions({
  actions,
  dataAttribute,
  center,
  allOutline,
}: {
  actions?: SourceAction[] | null;
  dataAttribute?: DataAttribute;
  center?: boolean;
  allOutline?: boolean;
}) {
  const visible = (actions ?? []).flatMap((action) => {
    const href = usableHref(action.destination?.href);
    const label = stegaClean(action.label)?.trim();
    return href && label ? [{ ...action, href }] : [];
  });
  if (!visible.length) return null;
  return (
    <div className={[css.buttonGroup, center ? css.center : ""].join(" ")}>
      {visible.map((action, index) => (
        <ButtonLink
          dataSanity={dataAttribute?.(`actions[_key=="${action._key}"]`)}
          href={action.href}
          key={action._key}
          label={action.label}
          openInNewTab={stegaClean(action.destination?.openInNewTab) === true}
          variant={allOutline || index > 0 ? "outline" : "default"}
        />
      ))}
    </div>
  );
}

const linkMark = createCustomLinkMarkRenderer(css.inlineLink);

const copyComponents: PortableTextProps["components"] = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    h2: ({ children }) => <h2 className={css.h4}>{children}</h2>,
    h3: ({ children }) => <h3 className={css.h5}>{children}</h3>,
    h4: ({ children }) => <h4 className={css.h6}>{children}</h4>,
    h5: ({ children }) => <h5 className={css.h6}>{children}</h5>,
    h6: ({ children }) => <h6 className={css.h6}>{children}</h6>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul>{children}</ul>,
    number: ({ children }) => <ol>{children}</ol>,
  },
  marks: {
    customLink: linkMark,
    link: linkMark,
  },
  types: {
    image: () => null,
    table: () => null,
  },
};

/** Editor copy with the live site's paragraph, list and link styles. */
export function SourceCopy({
  value,
  className,
  dataSanity,
}: {
  value?: PortableTextProps["value"] | null;
  className?: string;
  dataSanity?: string;
}) {
  if (!value || (Array.isArray(value) && !value.length)) return null;
  return (
    <div className={[css.copy, className].filter(Boolean).join(" ")} data-sanity={dataSanity}>
      <PortableText components={copyComponents} value={value} />
    </div>
  );
}

type Photo = {
  alt?: string | null;
  asset?: {
    _id?: string | null;
    metadata?: { dimensions?: { width?: number | null; height?: number | null } | null } | null;
  } | null;
} | null;

export function SourceImage({
  image,
  className,
  sizes = "(max-width: 767px) 90vw, 45vw",
  width = 1200,
  priority,
}: {
  image?: Photo;
  className?: string;
  sizes?: string;
  width?: number;
  priority?: boolean;
}) {
  if (!image?.asset?._id) return null;
  return (
    <Image
      alt={stegaClean(image.alt) || ""}
      className={className}
      height={image.asset.metadata?.dimensions?.height || 1000}
      preload={priority}
      sizes={sizes}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      src={urlFor(image as any).width(width).url()}
      width={image.asset.metadata?.dimensions?.width || 1000}
    />
  );
}

export { css as innerCss };
