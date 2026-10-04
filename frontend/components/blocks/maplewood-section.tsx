import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { stegaClean } from "next-sanity";
import { getSafeLinkHref } from "@/lib/safe-href";
import { urlFor } from "@/sanity/lib/image";
import type { HOME_PAGE_QUERY_RESULT } from "@/sanity.types";
import css from "./maplewood-home.module.css";

export type HomeBlock = NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number];
export type SectionProps<T extends HomeBlock["_type"]> = Extract<HomeBlock, { _type: T }> & { dataAttribute?: (path: string) => string | undefined };
type Actions = Extract<HomeBlock, { _type: "videoHero" }>["actions"];
type Photo = NonNullable<Extract<HomeBlock, { _type: "videoZoomGrid" }>["gridImages"]>[number];

export function SectionActions({ actions, dataAttribute }: { actions: Actions; dataAttribute?: (path: string) => string | undefined }) {
  return <div className={css.actions}>{actions?.map((action) => {
    const href = getSafeLinkHref(action.destination?.href);
    if (!href || href === "#" || !stegaClean(action.label)?.trim()) return null;
    return <Link key={action._key} href={href} className={css.action} data-sanity={dataAttribute?.(`actions[_key=="${action._key}"]`)} target={action.destination?.openInNewTab ? "_blank" : undefined} rel={action.destination?.openInNewTab ? "noopener noreferrer" : undefined}>{action.label}<ChevronRight size={16} aria-hidden /></Link>;
  })}</div>;
}
export function SectionImage({ image, className, sizes = "(max-width: 767px) 100vw, 50vw", priority = false }: { image?: Photo | null; className?: string; sizes?: string; priority?: boolean }) {
  if (!image?.asset?._id) return null;
  return <Image src={urlFor(image).width(1600).url()} alt={stegaClean(image.alt) || ""} width={image.asset.metadata?.dimensions?.width || 1600} height={image.asset.metadata?.dimensions?.height || 1000} className={className} sizes={sizes} preload={priority} />;
}
export function HighlightedTitle({ title, highlightText }: { title?: string | null; highlightText?: string | null }) {
  const cleanTitle = stegaClean(title) || "";
  const highlight = stegaClean(highlightText) || "";
  if (!highlight || !cleanTitle.includes(highlight)) return <>{title}</>;
  const index = cleanTitle.indexOf(highlight);
  return <>{cleanTitle.slice(0, index)}<span className={css.highlight}>{highlight}</span>{cleanTitle.slice(index + highlight.length)}</>;
}
