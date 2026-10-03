import { sectionThemeClass, type SectionTheme } from "./section-theme";
import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import type { ComponentProps } from "react";
import styles from "./cta-banner.module.css";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type CtaBannerBlock = Extract<PageBlock, { _type: "ctaBanner" }>;

type CtaBannerProps = CtaBannerBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

/*
 * CTA Banner — the handoff block, in two weights.
 *
 * Closing band: the last thing before the footer. Forest Floor field with
 * rounded top corners tucked under the section above, headline left, the two actions right, one amber
 * primary and one ghost. Nudge: a quiet card between sections for "not sure
 * yet?" moments; the card takes the surface one step off its field (cream on
 * white, white on cream, Forest Panel on green) and a hairline divides copy
 * from action on desktop. Both weights use the section rhythm and tuck like
 * every other section. Buttons stack on phones in both weights. Both reveal
 * on scroll; reduced motion skips it.
 */

type ButtonVariant = NonNullable<ComponentProps<typeof Button>["variant"]>;

/** An editor's stored button variant wins when it is one we render. */
function resolveCtaButtonVariant(
  variant: string | null | undefined,
  index: number,
): ButtonVariant {
  const cleanVariant = stegaClean(variant);
  if (
    cleanVariant === "default" ||
    cleanVariant === "secondary" ||
    cleanVariant === "outline" ||
    cleanVariant === "ghost" ||
    cleanVariant === "link"
  ) {
    return cleanVariant;
  }
  return index === 0 ? "default" : "outline";
}

export function resolveCtaBannerVariant(variant?: string | null) {
  return stegaClean(variant) === "nudge" ? "nudge" : "closing";
}

function CtaButtons({
  buttons,
  dataAttribute,
  onDark,
}: Readonly<{
  buttons: CtaBannerProps["buttons"];
  dataAttribute?: CtaBannerProps["dataAttribute"];
  onDark: boolean;
}>) {
  const actions = (buttons ?? []).slice(0, 2).flatMap((button, index) => {
    const href = getSafeLinkHref(button.href);
    if (!href) return [];
    return [
      {
        href,
        key: button._key ?? `${href}-${index}`,
        label: stegaClean(button.text)?.trim() || "Learn more",
        openInNewTab: Boolean(stegaClean(button.openInNewTab)),
        path: `buttons[_key=="${button._key}"]`,
        storedVariant: button.variant,
      },
    ];
  }).map(({ storedVariant, ...action }, index) => ({
    ...action,
    primary: index === 0,
    variant: resolveCtaButtonVariant(storedVariant, index),
  }));

  if (!actions.length) return null;

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      data-sanity={dataAttribute?.("buttons")}
    >
      {actions.map((action) => (
        <Button
          asChild
          // Phones stack full-width buttons, and a label can be an email
          // address wider than the screen. There the label wraps and the
          // button grows past its standard height instead of overflowing.
          className="w-full max-sm:h-auto max-sm:min-h-(--control-height) max-sm:py-3 max-sm:text-center max-sm:whitespace-normal max-sm:wrap-anywhere sm:w-auto"
          key={action.key}
          onDark={onDark}
          variant={action.variant}
        >
          <Link
            data-sanity={dataAttribute?.(action.path)}
            href={action.href}
            rel={action.openInNewTab ? "noopener noreferrer" : undefined}
            target={action.openInNewTab ? "_blank" : undefined}
          >
            {action.label}
            {action.openInNewTab ? (
              <ArrowUpRight aria-hidden="true" className="size-4" />
            ) : action.primary ? (
              <ArrowRight aria-hidden="true" className="size-4" />
            ) : null}
          </Link>
        </Button>
      ))}
    </div>
  );
}

/**
 * The nudge card must contrast with the field it sits on: a cream card on
 * the white field, a white card on cream, a Forest Panel on green.
 */
function nudgeCardClass(theme: SectionTheme) {
  if (theme === "green") return "card-panel border-border";
  if (theme === "cream") return "card-bright border-foreground/10";
  return "card-cream border-foreground/10";
}

export default function CtaBanner({
  _key,
  background,
  buttons,
  dataAttribute,
  description,
  title,
  variant,
}: CtaBannerProps) {
  if (!title) return null;

  const cleanKey = stegaClean(_key);
  const titleId = `cta-banner-${cleanKey}-title`;
  const cleanDescription = stegaClean(description)?.trim();
  const weight = resolveCtaBannerVariant(variant);
  const theme = background ?? (weight === "nudge" ? "white" : "green");

  if (weight === "nudge") {
    return (
      <section
        aria-labelledby={titleId}
        className={`${sectionThemeClass(theme)} py-section`}
        id={`cta-banner-${cleanKey}`}
      >
        <div className="container-content">
          <div
            className={cn(
              "grid gap-7 rounded-xl border px-6 py-7 sm:px-[38px] sm:py-[34px] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-0",
              nudgeCardClass(theme),
              styles.reveal,
            )}
          >
            <div className="grid gap-3 lg:pr-12">
              <h2
                className="text-balance font-display text-title-lg leading-[1.05] tracking-[-0.02em] font-extrabold sm:text-[34px]"
                data-sanity={dataAttribute?.("title")}
                id={titleId}
              >
                {title}
              </h2>
              {cleanDescription ? (
                <p
                  className="max-w-[36rem] text-pretty text-[17px]/[1.6] opacity-75"
                  data-sanity={dataAttribute?.("description")}
                >
                  {description}
                </p>
              ) : null}
            </div>
            <div className="border-current/15 lg:border-l lg:pl-12">
              <CtaButtons
                buttons={buttons}
                dataAttribute={dataAttribute}
                onDark={theme === "green"}
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={titleId}
      className={cn("py-section", sectionThemeClass(theme))}
      id={`cta-banner-${cleanKey}`}
    >
      <div
        className={cn(
          "container-content grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-14",
          styles.reveal,
        )}
      >
        <div className="lg:col-span-8">
          <h2
            className="max-w-3xl text-balance font-display text-headline"
            data-sanity={dataAttribute?.("title")}
            id={titleId}
          >
            {title}
          </h2>
          {cleanDescription ? (
            <p
              className="mt-6 max-w-xl text-pretty text-lg/relaxed opacity-80"
              data-sanity={dataAttribute?.("description")}
            >
              {description}
            </p>
          ) : null}
        </div>
        <div className="lg:col-span-4 lg:flex lg:justify-end">
          <CtaButtons buttons={buttons} dataAttribute={dataAttribute} onDark={theme === "green"} />
        </div>
      </div>
    </section>
  );
}
