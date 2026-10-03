import { getSafeLinkHref } from "@/lib/safe-href";
import type { PortableTextMarkComponent } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import Link from "next/link";

type CustomLinkMark = {
  _type: "customLink";
  href?: string | null;
  openInNewTab?: boolean | null;
};

const defaultLinkClassName =
  "font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary";

/** Builds an inline link renderer with shared safety rules and surface-specific color. */
export function createCustomLinkMarkRenderer(
  className = defaultLinkClassName,
): PortableTextMarkComponent<CustomLinkMark> {
  return function CustomLinkMark({ children, value }) {
    const href = getSafeLinkHref(value?.href);
    if (!href) return <span>{children}</span>;

    const openInNewTab = stegaClean(value?.openInNewTab) === true;

    return (
      <Link
        className={className}
        href={href}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        target={openInNewTab ? "_blank" : undefined}
      >
        {children}
      </Link>
    );
  };
}

/** Shared default rendering for inline Portable Text links. */
export const CustomLinkMarkRenderer = createCustomLinkMarkRenderer();
