// Every stored icon becomes the same icon from the Material two-tone set that
// the icon picker offers. Icons imported from the old site kept only their
// artwork, so the picker showed them as empty; icons picked from Lucide name
// a set the picker no longer has. Imported artwork is found by its hash.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const SVGS = JSON.parse(
  readFileSync(new URL("../../schemas/inputs/material-icons.json", import.meta.url), "utf8"),
);

/** Imported artwork, by the first 16 hex digits of its SHA-256, to an icon name. */
const BY_ARTWORK = {
  "c03c7bc395760eff": "add-task", // Material round style
  "64c1583e24e91fce": "android", // not Material, hand-picked
  "9c7f930cb0a35b11": "attractions", // not Material, hand-picked
  "ce11b12c329c655c": "backpack", // Material round style
  "ce39f88c164cfcde": "brush", // not Material, hand-picked
  "d90f386128d2ef0b": "bus-alert", // Material round style
  "ea1ac9bdb2e59cc5": "cake", // Material round style
  "ca507e265590f107": "calendar-month", // Material twotone style
  "7b8b02b0e857c8cd": "calendar-month", // Material round style
  "20679d4e4eeb0cf9": "camera-alt", // Material round style
  "4b4a09068ca8612d": "card-giftcard", // Material twotone style
  "f8fd941b9348141c": "card-membership", // Material round style
  "c357a1f037a64fdf": "category", // not Material, hand-picked
  "03117636e07b50dc": "category", // Material round style
  "407f60360a4b0049": "check-circle", // Material outline style
  "ac54fdb1ded635c5": "child-care", // Material round style
  "30bdd7182c4484c5": "child-care", // Material round style
  "c1f87fc0614b3a4a": "directions-run", // Material round style
  "56f5be563a312a6b": "emoji-people", // Material round style
  "eafcb548727759e4": "event-note", // not Material, hand-picked
  "1c546e42b04264e5": "explore", // Material baseline style
  "cd8333cdf51ad8c6": "family-restroom", // Material baseline style
  "29fd1f72f1156a8b": "file-present", // Material outline style
  "08963f9c989f5aac": "flag", // Material round style
  "2d6adbe6fa081858": "group-work", // Material baseline style
  "a9d077f19e380f38": "groups", // Material round style
  "168d45bbefa0e7d3": "handshake", // Material twotone style
  "8ca7f3c2265a28e1": "health-and-safety", // Material round style
  "b3be5a6dadc90089": "hiking", // Material baseline style
  "8ef17bae4703041d": "home-work", // Material round style
  "07f1fd9d6be937d4": "lightbulb", // not Material, hand-picked
  "eb966e2261631a3a": "local-activity", // Material baseline style
  "fac67ff5a5515a5c": "login", // Material round style
  "f645450d86eb846f": "mail", // not Material, hand-picked
  "2c235b8250b69ddf": "mail-outline", // Material round style
  "0779fa85e8849f8e": "mark-chat-unread", // Material baseline style
  "93d02c3608687825": "more-time", // Material round style
  "82000d58347056f3": "notification-important", // Material round style
  "77a6f0021a935830": "palette", // Material baseline style
  "052a3c77a9f30485": "park", // Material round style
  "f3b8ce31d7c159f0": "people-alt", // Material round style
  "95db56d37d1421ed": "phone", // not Material, hand-picked
  "ffb459b75a1771e2": "phone-iphone", // not Material, hand-picked
  "c57278de74edd8fe": "place", // not Material, hand-picked
  "40a4c1e7eac0f099": "playlist-play", // Material round style
  "1d3a5d1cb98d7a5c": "pool", // Material round style
  "c57bd8de9944b4be": "remove-circle", // not Material, hand-picked
  "06653f17fa39fdbe": "rotate-90-degrees-cw", // Material round style
  "7cd3147d37a7a377": "school", // Material round style
  "712095ce84873bda": "sentiment-very-satisfied", // Material round style
  "44ac02eee931ecce": "sentiment-very-satisfied", // not Material, hand-picked
  "68f9c026fd9e8413": "sports", // Material baseline style
  "409299b50c0f614e": "sports-basketball", // Material twotone style
  "212e4e710d2353a0": "sports-gymnastics", // Material baseline style
  "a414daa7d9ce7488": "stairs", // not Material, hand-picked
  "f870493941f3ef0d": "star", // Material round style
  "dda872caa6188023": "star-rate", // Material round style
  "285fd4b50cd4d75c": "stars", // Material round style
  "f26d29e4a8647fc3": "thermostat", // Material round style
  "d79de95f91d68bd4": "volunteer-activism", // not Material, hand-picked
  "007b3e8da86c2125": "wb-sunny", // Material twotone style
  "f29b1b3f9a5f24dc": "workspace-premium", // Material round style
};

/** Icons picked from Lucide, by their Lucide name. */
const BY_LUCIDE_NAME = {
  "badge-question-mark": "help",
  "calendar-days": "calendar-month",
  flag: "flag",
  gift: "card-giftcard",
  bus: "directions-bus",
  search: "search",
  smartphone: "smartphone",
  sun: "wb-sunny",
  "tent-tree": "attractions",
  "user-plus": "person-add",
};

export const artworkHash = (svg) => createHash("sha256").update(svg).digest("hex").slice(0, 16);

/** The two-tone icon name for a stored icon, or undefined when it is unknown. */
export function twoToneName(icon) {
  if (icon.name && SVGS[icon.name] === icon.svg) return icon.name;
  if (icon.name) return Object.hasOwn(BY_LUCIDE_NAME, icon.name) ? BY_LUCIDE_NAME[icon.name] : undefined;
  return icon.svg ? BY_ARTWORK[artworkHash(icon.svg)] : undefined;
}

const isIcon = (value) =>
  value && typeof value === "object" && !Array.isArray(value) && (value.name || value.svg);

/** Visit every value stored under an `icon` key, at any depth. */
function mapIcons(value, change) {
  if (Array.isArray(value)) return value.map((item) => mapIcons(item, change));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key === "icon" && isIcon(item) ? change(item) : mapIcons(item, change),
    ]),
  );
}

export default {
  description: "Every stored icon becomes the same icon from the Material two-tone set.",

  prepare({ documents, note }) {
    const unknown = new Set();
    let count = 0;
    for (const document of documents)
      mapIcons(document, (icon) => {
        count++;
        if (!twoToneName(icon)) unknown.add(icon.name ?? `artwork ${artworkHash(icon.svg)}`);
        return icon;
      });
    if (unknown.size) throw new Error(`No two-tone icon for: ${[...unknown].join(", ")}`);
    note(`${count} stored icons checked`);

    return (document) =>
      mapIcons(document, (icon) => {
        const name = twoToneName(icon);
        return { ...icon, name, svg: SVGS[name] };
      });
  },
};
