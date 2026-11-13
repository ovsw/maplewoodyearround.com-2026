// Camp HQ settings shared by the request proxy and the Camp HQ pages.

export const CAMP_HQ_PATH = "/hq";
export const CAMP_HQ_SIGN_IN_PATH = "/hq/sign-in";

/** Sent on every Camp HQ response so search engines skip the whole area. */
export const CAMP_HQ_ROBOTS_HEADER = "noindex, nofollow";

export type CampHqClerkKeys = { publishableKey: string; secretKey: string };

/**
 * The Clerk keys, or null when either is missing. Camp HQ then shows a
 * "not available" page and no sign-in code runs (production has no keys yet).
 */
export function getCampHqClerkKeys(): CampHqClerkKeys | null {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  return publishableKey && secretKey ? { publishableKey, secretKey } : null;
}

export function isCampHqPath(pathname: string) {
  return pathname === CAMP_HQ_PATH || pathname.startsWith(`${CAMP_HQ_PATH}/`);
}

export function isCampHqSignInPath(pathname: string) {
  return (
    pathname === CAMP_HQ_SIGN_IN_PATH ||
    pathname.startsWith(`${CAMP_HQ_SIGN_IN_PATH}/`)
  );
}
