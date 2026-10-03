"use client";

import { X } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { HeaderLink } from "./header-link";
import type { HeaderNavigationModel } from "./model";
import { NavigationIcon } from "./navigation-icon";
import type { HeaderTheme } from "./theme";

function HamburgerIcon({ open }: { open: boolean }) {
  const bar =
    "h-[1.5px] w-full origin-center rounded-full bg-current transition-all motion-base motion-reduce:transition-none";

  return (
    <span aria-hidden="true" className="flex w-4 flex-col gap-1">
      <span className={cn(bar, open && "translate-y-[5.5px] rotate-45")} />
      <span className={cn(bar, open && "scale-x-0 opacity-0")} />
      <span className={cn(bar, open && "-translate-y-[5.5px] -rotate-45")} />
    </span>
  );
}

export function MobileNav({
  brand,
  brandLabel,
  navigation,
  theme,
}: {
  brand: ReactNode;
  brandLabel: string;
  navigation: HeaderNavigationModel;
  theme: HeaderTheme;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const dark = theme === "dark";
  const linkClassName =
    "flex min-h-11 items-center rounded-[var(--radius-md)] px-3 text-base font-semibold transition-colors motion-fast hover:bg-accent focus-ring";

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          aria-label={open ? "Close menu" : "Open menu"}
          className={cn(
            "border bg-transparent text-foreground hover:shadow-none",
            dark
              ? "border-foreground/45 hover:bg-foreground/8"
              : "border-foreground/25 hover:bg-link/8",
          )}
          size="icon"
          variant="ghost"
        >
          <HamburgerIcon open={open} />
        </Button>
      </SheetTrigger>
      <SheetContent
        className={cn(
          "!w-full !max-w-none gap-0 border-l border-foreground/15 px-0 sm:!max-w-md",
          dark ? "field-green" : "field-cream",
        )}
        showCloseButton={false}
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-foreground/15 px-6 py-5">
          <div className="flex min-w-0 items-center">{brand}</div>
          <SheetTitle className="sr-only">Main navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Browse {brandLabel} pages and programs.
          </SheetDescription>
          <SheetClose
            className={cn(
              "flex size-11 items-center justify-center rounded-full border transition-colors motion-fast focus-ring",
              dark
                ? "border-foreground/45 hover:bg-foreground/8"
                : "border-foreground/25 hover:bg-link/8",
            )}
          >
            <X aria-hidden="true" className="size-5" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetHeader>
        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav
            aria-label="Mobile navigation"
            className="grid content-start gap-1 px-3 py-4"
          >
            <Accordion collapsible type="single">
              {navigation.items.map((item) =>
                item.kind === "link" ? (
                  <HeaderLink
                    className={linkClassName}
                    key={item.key}
                    link={item.link}
                    onClick={close}
                  />
                ) : (
                  <AccordionItem className="border-b-0" key={item.key} value={item.key}>
                    <AccordionTrigger
                      className={cn(
                        // The shared accordion tints its chevron with the cream-surface
                        // "muted" token, which disappears on the dark sheet. Retint it
                        // from the sheet's own ink and give it a tap-sized footprint.
                        "min-h-11 items-center rounded-[var(--radius-md)] px-3 py-2 text-base font-semibold hover:bg-accent hover:no-underline [&>svg]:size-5 [&>svg]:translate-y-0 [&>svg]:stroke-[2.25]",
                        dark
                          ? "[&>svg]:text-soft-foreground"
                          : "[&>svg]:text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-1">
                        {item.links.map((child) => (
                          <HeaderLink
                            className="flex min-h-11 items-start gap-3 rounded-[var(--radius-md)] p-3 transition-colors motion-fast hover:bg-accent focus-ring"
                            key={child.key}
                            link={child.link}
                            onClick={close}
                          >
                            {child.icon ? (
                              <span
                                className={cn(
                                  "flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-link [&_svg]:size-4",
                                  dark ? "bg-fill-panel" : "bg-link/10",
                                )}
                              >
                                <NavigationIcon icon={child.icon} />
                              </span>
                            ) : null}
                            <span className="grid gap-1">
                              <span className="font-semibold leading-tight">{child.label}</span>
                              {child.description ? (
                                <span
                                  className={cn(
                                    "text-[15px] leading-tight",
                                    dark ? "text-foreground/65" : "text-muted-foreground",
                                  )}
                                >
                                  {child.description}
                                </span>
                              ) : null}
                            </span>
                          </HeaderLink>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ),
              )}
            </Accordion>
          </nav>
        </div>
        <SheetFooter className="gap-4 border-t border-foreground/15 p-4">
          {navigation.actions.map((action) => (
            <HeaderLink
              className={cn(
                buttonVariants({ size: "default", variant: "outline" }),
                "w-full",
                dark &&
                  "border-foreground/45 text-foreground hover:border-foreground/70 hover:bg-foreground/8 hover:text-foreground",
              )}
              key={action.key}
              link={action.link}
              onClick={close}
            />
          ))}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
