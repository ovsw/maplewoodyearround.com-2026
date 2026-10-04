import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import type { HeaderLinkModel } from "./model";

export function HeaderLink({
  children,
  className,
  link,
  onClick,
  accent,
}: {
  children?: ReactNode;
  className?: string;
  link: HeaderLinkModel;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  accent?: string;
}) {
  return (
    <Link
      className={className}
      data-accent={accent}
      href={link.href}
      onClick={onClick}
      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
      target={link.openInNewTab ? "_blank" : undefined}
    >
      {children ?? link.label}
    </Link>
  );
}
