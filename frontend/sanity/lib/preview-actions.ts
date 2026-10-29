"use server";

import { cookies } from "next/headers";
import {
  perspectiveChangeAction,
  variantChangeAction,
} from "next-sanity/visual-editing/server-actions";

// Presentation tells the page its perspective every time the two connect, and
// next-sanity's own action then writes the cookie and re-renders the page even
// when nothing changed (it skips that only outside production). Each re-render
// reconnects, so one page load fired the action about ten times, and an answer
// that arrived after the editor had moved on painted the old page under the new
// address. These wrappers call the next-sanity action only when the value
// really changes.

// The cookie names next-sanity writes (from @sanity/preview-url-secret).
const perspectiveCookieName = "sanity-preview-perspective";
const variantCookieName = "sanity-preview-variant";

const asCookieValue = (value: unknown) =>
  Array.isArray(value) ? value.join(",") : typeof value === "string" ? value : "";

export async function perspectiveChange(perspective: unknown) {
  const jar = await cookies();
  if (asCookieValue(perspective) === jar.get(perspectiveCookieName)?.value) return;
  await perspectiveChangeAction(perspective as never);
}

export async function variantChange(variant: unknown) {
  const jar = await cookies();
  if ((asCookieValue(variant) || undefined) === jar.get(variantCookieName)?.value) return;
  await variantChangeAction(variant as never);
}
