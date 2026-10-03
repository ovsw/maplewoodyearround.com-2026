import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import type { HeaderLinkModel } from "./model";

export function HeaderLink({
  children,
  className,
  link,
  onClick,
}: {
  children?: ReactNode;
  className?: string;
  link: HeaderLinkModel;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      className={className}
      href={link.href}
      onClick={onClick}
      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
      target={link.openInNewTab ? "_blank" : undefined}
    >
      {children ?? link.label}
    </Link>
  );
}
