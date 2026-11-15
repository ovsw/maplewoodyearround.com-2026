"use client";

// The bar above every Camp HQ page: the sidebar toggle and where you are.
import { usePathname } from "next/navigation";
import { Fragment, Suspense } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { activeHref } from "./nav";
import { useNavGroups } from "./nav-context";

function WhereYouAre() {
  const pathname = usePathname();
  const { groups } = useNavGroups();
  const href = activeHref(pathname, groups);
  const group = groups.find((entry) => entry.links.some((link) => link.href === href));
  const link = group?.links.find((entry) => entry.href === href);
  const trail = [group?.title, link?.label].filter((part): part is string => Boolean(part));

  if (trail.length === 0) return null;
  return (
    <>
      <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {trail.map((crumb, index) => (
            <Fragment key={crumb}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {index === trail.length - 1 ? (
                  // Plain text: the shadcn BreadcrumbPage claims to be a link, which
                  // would give the page two links with the sidebar item's name.
                  <span aria-current="page" className="font-medium text-foreground">
                    {crumb}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{crumb}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}

export function HqHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur print:hidden">
      <SidebarTrigger className="-ml-1" />
      {/* The address is read at request time, so the bar renders first. */}
      <Suspense fallback={null}>
        <WhereYouAre />
      </Suspense>
    </header>
  );
}
