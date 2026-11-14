// Finding a child by typing part of their name. Safe to import from client
// components.

function fold(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True when every word typed appears in the name, ignoring case and accents:
 * "ava b" finds "Ava Brookfield". An empty search matches everyone.
 */
export function matchesCamperName(name: string, search: string): boolean {
  const words = fold(search).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const folded = fold(name);
  return words.every((word) => folded.includes(word));
}
