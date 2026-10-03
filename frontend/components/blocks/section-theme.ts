import { cn } from "@/lib/utils";

/*
 * The three editor backgrounds. Each maps to a field utility in globals.css,
 * which paints the ground and re-points the job tokens (foreground, link,
 * card, border…) for everything inside the section. See DESIGN.md § Colors
 * → Fields.
 */
export type SectionTheme = "white" | "cream" | "green";

export function sectionThemeClass(theme: SectionTheme | null | undefined) {
  return cn(
    theme === "green" && "field-green",
    theme === "cream" && "field-cream",
    (!theme || theme === "white") && "field-white",
  );
}
