import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Button roles — see DESIGN.md § Components → Buttons.
 *
 * Four roles (primary, outline, ghost, link) and three sizes (default,
 * compact, hero). Buttons are flat at rest and lift on hover; the hero CTA
 * shadow is an opt-in emphasis flag, not a default.
 * Call sites should not override height, padding, or radius.
 *
 * Colours are job tokens only (see DESIGN.md § Colors). The outline role
 * draws its border in the current text colour: DESIGN.md asks for a 25%
 * (cream) or 50% (dark) edge, but the site has always rendered the full
 * colour, and this refactor keeps the rendered look.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold transition-[background-color,border-color,color,box-shadow,translate] motion-base hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  {
    variants: {
      variant: {
        /* `default` is the CMS's name for the primary role; both are kept so
           stored Sanity documents keep resolving. See BUTTON_VARIANTS. */
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground",
        /* `secondary` is the CMS's name for the outline role. Text and border
           follow the field, so the outline is right on Green too. */
        secondary:
          "border border-current bg-transparent text-foreground hover:border-primary/30 hover:bg-card hover:text-card-foreground",
        outline:
          "border border-current bg-transparent text-foreground hover:border-primary/30 hover:bg-card hover:text-card-foreground",
        ghost: "hover:bg-secondary hover:text-secondary-foreground hover:shadow-none",
        link: "text-primary underline-offset-4 hover:underline hover:shadow-none hover:translate-y-0",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-110",
      },
      size: {
        /* Rare. The one action in a section built around a monumental
           headline — see the Hero Is Earned rule in DESIGN.md. The larger
           label matters more than the taller box: at the default 14.5px a
           button reads as an afterthought beside 66px display type. */
        hero:
          "typo-button-lg h-(--control-height-hero) px-(--control-inline-hero) has-[>svg]:px-7",
        default:
          "typo-button h-(--control-height) px-(--control-inline) has-[>svg]:px-6",
        compact:
          "typo-button h-(--control-height-compact) px-(--control-inline-compact) has-[>svg]:px-4",
        icon: "typo-button size-11",
      },
      /* On a photograph or video, which is not a field, the outline and ghost
         variants need a light edge. On the Green or Night field they need
         nothing: the field tokens already turn them light. */
      onDark: {
        true: "",
        false: "",
      },
      /* Rare. Reserved for the one primary action a page is built around. */
      emphasis: {
        true: "shadow-hero-cta hover:shadow-hero-cta",
        false: "",
      },
      lift: {
        true:
          "hover:shadow-interactive-lift hover:[--focus-ring-keep:var(--shadow-interactive-lift)]",
        false: "hover:shadow-none",
      },
    },
    compoundVariants: [
      {
        variant: ["outline", "secondary"],
        onDark: true,
        class:
          "text-white hover:border-white/45 hover:bg-white/10 hover:text-white",
      },
      {
        variant: "ghost",
        onDark: true,
        class: "text-white hover:bg-white/10 hover:text-white",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
      onDark: false,
      emphasis: false,
      lift: true,
    },
  }
);

function Button({
  className,
  variant,
  size,
  onDark,
  emphasis,
  lift,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, onDark, emphasis, lift, className }),
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
