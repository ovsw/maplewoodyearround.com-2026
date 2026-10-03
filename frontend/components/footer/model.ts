import { urlFor } from "@/sanity/lib/image";

export type FooterLinkModel = {
  key: string;
  label: string;
  href: string;
  openInNewTab: boolean;
};

export type FooterColumnModel = {
  key: string;
  heading: string;
  links: FooterLinkModel[];
};

export type FooterLogoModel = {
  key: string;
  alt: string;
  image: {
    src: string;
    width: number;
    height: number;
  };
  link: FooterLinkModel;
};

export type FooterContactIcon = "pin" | "phone" | "email";

export type FooterContactLinkModel = {
  icon: FooterContactIcon;
  link: FooterLinkModel;
};

export type FooterModel = {
  eyebrow: string;
  heading: string;
  accent: string;
  actions: FooterLinkModel[];
  logos: FooterLogoModel[];
  contactLinks: FooterContactLinkModel[];
  columns: FooterColumnModel[];
  legalLinks: FooterLinkModel[];
  copyrightYears: string;
  copyrightOwner: string;
};

type RawDestination = { href?: string | null; openInNewTab?: boolean | null };
type RawLink = {
  _key?: string | null;
  label?: string | null;
  destination?: RawDestination | null;
};

type RawImage = {
  asset?: {
    _id?: string | null;
    metadata?: {
      dimensions?: { width?: number | null; height?: number | null } | null;
    } | null;
  } | null;
};

export type RawFooter = {
  _id?: string | null;
  eyebrow?: string | null;
  heading?: string | null;
  accent?: string | null;
  actions?: RawLink[] | null;
  logos?: Array<{
    _key?: string | null;
    alt?: string | null;
    image?: RawImage | null;
    destination?: RawDestination | null;
  } | null> | null;
  contactLinks?: Array<{
    _key?: string | null;
    icon?: string | null;
    label?: string | null;
    destination?: RawDestination | null;
  } | null> | null;
  columns?: Array<{
    _key?: string | null;
    heading?: string | null;
    links?: RawLink[] | null;
  } | null> | null;
  legalLinks?: RawLink[] | null;
  copyrightStartYear?: number | null;
  copyrightOwner?: string | null;
} | null;

function text(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function normalizeHref(value: string | null | undefined): string | null {
  const href = text(value);
  if (!href || href === "#") return null;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) return href;
  if (/^[a-z][a-z\d+.-]*:/i.test(href)) return null;
  return `/${href.replace(/^\/+/, "")}`;
}

function link(
  raw: RawLink | null | undefined,
  fallbackKey?: string,
): FooterLinkModel | null {
  const key = text(raw?._key) ?? fallbackKey ?? null;
  const label = text(raw?.label);
  const href = normalizeHref(raw?.destination?.href);
  return key && label && href
    ? {
        key,
        label,
        href,
        openInNewTab: Boolean(raw?.destination?.openInNewTab),
      }
    : null;
}

function links(raw: RawLink[] | null | undefined): FooterLinkModel[] {
  return (raw ?? []).flatMap((item) => {
    const value = link(item);
    return value ? [value] : [];
  });
}

function image(source: RawImage | null | undefined) {
  const dimensions = source?.asset?.metadata?.dimensions;
  if (!source || !dimensions?.width || !dimensions.height) return null;
  try {
    return {
      src: urlFor(source as Parameters<typeof urlFor>[0]).url(),
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch {
    return null;
  }
}

function isContactIcon(value: string): value is FooterContactIcon {
  return value === "pin" || value === "phone" || value === "email";
}

export function createFooterModel(
  raw: RawFooter,
  currentYear: number,
): FooterModel | null {
  const eyebrow = text(raw?.eyebrow);
  const heading = text(raw?.heading);
  const accent = text(raw?.accent);
  const owner = text(raw?.copyrightOwner);
  const startYear = raw?.copyrightStartYear;
  if (
    raw?._id !== "footer" ||
    !eyebrow ||
    !heading ||
    !accent ||
    !owner ||
    !Number.isInteger(startYear) ||
    !Number.isInteger(currentYear)
  ) {
    return null;
  }

  const actions = links(raw.actions);
  const logos = (raw.logos ?? []).flatMap((item) => {
    const key = text(item?._key);
    const alt = text(item?.alt);
    const logoImage = image(item?.image);
    const logoLink = link(
      item
        ? { _key: item._key, label: item.alt, destination: item.destination }
        : null,
    );
    return key && alt && logoImage && logoLink
      ? [{ key, alt, image: logoImage, link: logoLink }]
      : [];
  });
  const contactLinks = (raw.contactLinks ?? []).flatMap((item) => {
    const icon = text(item?.icon);
    const contactLink = link(item);
    return icon && isContactIcon(icon) && contactLink
      ? [{ icon, link: contactLink }]
      : [];
  });
  const columns = (raw.columns ?? []).flatMap((column) => {
    const key = text(column?._key);
    const columnHeading = text(column?.heading);
    const columnLinks = links(column?.links);
    return key && columnHeading && columnLinks.length
      ? [{ key, heading: columnHeading, links: columnLinks }]
      : [];
  });
  const copyrightYears =
    startYear! < currentYear ? `${startYear}-${currentYear}` : `${currentYear}`;

  if (!actions.length || !logos.length || !contactLinks.length || !columns.length) {
    return null;
  }

  return {
    eyebrow,
    heading,
    accent,
    actions,
    logos,
    contactLinks,
    columns,
    legalLinks: links(raw.legalLinks),
    copyrightYears,
    copyrightOwner: owner,
  };
}
