/** Validate authored navigation and footer URLs before they reach a browser. */
export function validateDestinationUrl(value: string | undefined) {
  if (!value?.trim()) return "Enter a destination";
  // Browsers remove tabs/newlines and interpret backslashes as URL separators.
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return "Remove control characters and backslashes from the destination";
  const href = value.trim();
  if (/^\/(?!\/)/.test(href)) return true;
  // A link to a section of the current page, such as "#bus-map".
  if (/^#[A-Za-z][\w-]*$/.test(href)) return true;
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(href)) {
    return "Use an absolute URL, mailto:, tel:, a root-relative path, or #section";
  }
  try {
    new URL(href);
    return true;
  } catch {
    return "Enter a valid URL";
  }
}
