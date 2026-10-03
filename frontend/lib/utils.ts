import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The design system's typography utilities in `app/globals.css` all start
 * with `text-`. Without this registration tailwind-merge reads `text-eyebrow`
 * as a text colour and drops it when a `text-<colour>` class follows, so the
 * mono, uppercase eyebrow silently renders as body text.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-display-hero",
        "text-display-page",
        "text-headline",
        "text-title",
        "text-title-lg",
        "text-eyebrow",
        "text-label",
        "text-step-number",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: string): string => {
  const dateObj = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return dateObj.toLocaleDateString("en-US", options);
};
