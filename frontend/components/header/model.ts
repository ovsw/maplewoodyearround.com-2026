import { stegaClean } from "next-sanity";
import { urlFor } from "@/sanity/lib/image";
import { siteName } from "@/lib/site-name";
import { getSafeLinkHref } from "@/lib/safe-href";
import type { SETTINGS_QUERY_RESULT } from "@/sanity.types";
import type { NavigationIconModel } from "./navigation-icon";

export type HeaderLinkModel = {
  href: string;
  label: string;
  openInNewTab: boolean;
};

export type HeaderChildLinkModel = {
  key: string;
  label: string;
  description: string | null;
  icon: NavigationIconModel | null;
  link: HeaderLinkModel;
};

export type HeaderNavigationItem =
  | {
      key: string;
      kind: "link";
      label: string;
      link: HeaderLinkModel;
    }
  | {
      key: string;
      kind: "group";
      label: string;
      links: HeaderChildLinkModel[];
    };

export type HeaderNavigationModel = {
  items: HeaderNavigationItem[];
  actions: Array<{ key: string; link: HeaderLinkModel }>;
};

export type HeaderLogoModel = {
  src: string;
  width: number;
  height: number;
};

export type HeaderBrandModel = {
  label: string;
  light: HeaderLogoModel | null;
  dark: HeaderLogoModel | null;
};

export type HeaderModel = {
  brand: HeaderBrandModel;
  navigation: HeaderNavigationModel;
};

type RawDestination = { href?: string | null; openInNewTab?: boolean | null };
type RawChildLink = {
  _key?: string | null;
  label?: string | null;
  description?: string | null;
  icon?: { name?: unknown; svg?: string | null } | null;
  destination?: RawDestination | null;
};
type RawItem = {
  _key?: string | null;
  kind?: string | null;
  label?: string | null;
  destination?: RawDestination | null;
  links?: RawChildLink[] | null;
};
type RawAction = {
  _key?: string | null;
  label?: string | null;
  destination?: RawDestination | null;
};

export type RawHeaderNavigation = {
  _id?: string | null;
  items?: RawItem[] | null;
  actions?: RawAction[] | null;
} | null;

type RawLogoGroup =
  | { light?: unknown; dark?: unknown }
  | null
  | undefined;

type RawAsset = {
  asset?: { metadata?: { dimensions?: { width?: number; height?: number } } };
};

function toLogoModel(source: unknown): HeaderLogoModel | null {
  if (!source) return null;
  const dimensions = (source as RawAsset).asset?.metadata?.dimensions;
  try {
    return {
      src: urlFor(source as Parameters<typeof urlFor>[0]).url(),
      width: dimensions?.width ?? 216,
      height: dimensions?.height ?? 48,
    };
  } catch {
    return null;
  }
}

export function createHeaderBrandModel(
  settings: SETTINGS_QUERY_RESULT,
): HeaderBrandModel | null {
  if (!settings) return null;
  const label = settings.siteName?.trim() || siteName;
  if (!label) return null;
  const logo = settings?.logo as RawLogoGroup;
  return {
    label,
    light: toLogoModel(logo?.light),
    dark: toLogoModel(logo?.dark),
  };
}

function normalizeHref(value: string | null | undefined): string | null {
  const href = value?.trim();
  if (!href || href === "#") return null;
  return getSafeLinkHref(
    /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith("/")
      ? href
      : `/${href}`,
  );
}

function normalizeLink(
  label: string | null | undefined,
  destination: RawDestination | null | undefined,
): HeaderLinkModel | null {
  const cleanLabel = label?.trim();
  const href = normalizeHref(destination?.href);
  return cleanLabel && href
    ? {
        href,
        label: cleanLabel,
        openInNewTab: Boolean(destination?.openInNewTab),
      }
    : null;
}

export function createHeaderNavigationModel(
  raw: RawHeaderNavigation,
): HeaderNavigationModel {
  const items: HeaderNavigationItem[] = [];

  for (const item of raw?.items ?? []) {
    const key = item._key?.trim();
    const label = item.label?.trim();
    if (!key || !label) continue;

    if (item.kind === "link") {
      const link = normalizeLink(label, item.destination);
      if (link) items.push({ key, kind: "link", label, link });
      continue;
    }

    if (item.kind === "group") {
      const links = (item.links ?? []).flatMap((child) => {
        const childKey = child._key?.trim();
        const childLabel = child.label?.trim();
        const link = normalizeLink(childLabel, child.destination);
        if (!childKey || !childLabel || !link) return [];
        const rawName = child.icon?.name;
        const name =
          typeof rawName === "string" ? stegaClean(rawName)?.trim() : null;
        const svg = stegaClean(child.icon?.svg)?.trim() || null;
        return [
          {
            key: childKey,
            label: childLabel,
            description: child.description?.trim() || null,
            icon: name && svg ? { name, svg } : null,
            link,
          },
        ];
      });
      if (links.length) items.push({ key, kind: "group", label, links });
    }
  }

  const actions = (raw?.actions ?? [])
    .flatMap((action) => {
      const key = action._key?.trim();
      const link = normalizeLink(action.label, action.destination);
      return key && link ? [{ key, link }] : [];
    })
    .slice(0, 1);

  return { items, actions };
}
