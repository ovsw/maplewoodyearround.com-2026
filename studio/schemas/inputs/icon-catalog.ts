import { materialIconNames } from "./material-icon-names";

export type IconName = (typeof materialIconNames)[number];

export const iconNames = materialIconNames;

const iconNameSet = new Set<string>(iconNames);

export function isIconName(value: unknown): value is IconName {
  return typeof value === "string" && iconNameSet.has(value);
}

/**
 * The stored SVG markup for every icon. The file is about 1 MB, so the picker
 * loads it only when an editor opens it.
 */
export async function loadIconSvgs(): Promise<Record<string, string>> {
  return (await import("./material-icons.json")).default;
}
