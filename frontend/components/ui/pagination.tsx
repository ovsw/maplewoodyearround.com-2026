import * as React from "react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import { buttonVariants, type Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
 * shadcn/ui pagination, adapted: links are Next.js links, and the controls
 * take their colour from the section they sit on (`currentColor`), so the
 * same markup reads on white, cream, and green fields. The current page
 * uses the outline button role; every other page link is a quiet ghost.
 */

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      data-slot="pagination"
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex flex-row flex-wrap items-center gap-1", className)}
      data-slot="pagination-content"
      {...props}
    />
  );
}

function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
  onDark?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<typeof Link>;

const quietControl =
  "text-current hover:bg-current/8 hover:text-current";

function PaginationLink({
  className,
  isActive,
  onDark = false,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          lift: false,
          onDark,
          size,
          variant: isActive ? "outline" : "ghost",
        }),
        !isActive && quietControl,
        className,
      )}
      data-active={isActive}
      data-slot="pagination-link"
      {...props}
    />
  );
}

function PaginationPrevious(props: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Go to previous page" size="default" {...props}>
      <ChevronLeftIcon aria-hidden="true" />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}

function PaginationNext(props: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Go to next page" size="default" {...props}>
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon aria-hidden="true" />
    </PaginationLink>
  );
}

/** Previous or Next on the first or last page: shown, but not a link. */
function PaginationDisabled({
  children,
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-disabled="true"
      className={cn(
        buttonVariants({ lift: false, size: "default", variant: "ghost" }),
        "pointer-events-none text-current opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-11 items-center justify-center", className)}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationDisabled,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
