import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  CAMP_HQ_ROBOTS_HEADER,
  CAMP_HQ_SIGN_IN_PATH,
  getCampHqClerkKeys,
  isCampHqSignInPath,
} from "@/lib/hq/config";

let clerkHandler: Promise<NextMiddleware> | undefined;

// Clerk is imported only when a Camp HQ request arrives with keys set, so
// public pages never load it.
function getClerkHandler() {
  clerkHandler ??= import("@clerk/nextjs/server").then(({ clerkMiddleware }) =>
    clerkMiddleware(
      async (auth, request) => {
        if (isCampHqSignInPath(request.nextUrl.pathname)) return;
        const { userId } = await auth();
        if (userId) return;
        const signInUrl = new URL(CAMP_HQ_SIGN_IN_PATH, request.url);
        signInUrl.searchParams.set("redirect_url", request.url);
        return NextResponse.redirect(signInUrl);
      },
      // Clerk reads both keys from the environment. Passing the secret key as
      // an option would need an extra encryption key.
      { signInUrl: CAMP_HQ_SIGN_IN_PATH },
    ),
  );
  return clerkHandler;
}

/**
 * Handles every `/hq` request: a signed-out visitor is sent to the Camp HQ
 * sign-in page. Without Clerk keys the request passes through and the Camp HQ
 * layout says Camp HQ is not available.
 */
export async function campHqProxy(
  request: NextRequest,
  event: NextFetchEvent | undefined,
) {
  let response: Response;
  if (!getCampHqClerkKeys()) {
    response = NextResponse.next();
  } else {
    const handler = await getClerkHandler();
    response =
      (await handler(request, event as NextFetchEvent)) ?? NextResponse.next();
  }
  return withRobotsHeader(response);
}

function withRobotsHeader(response: Response) {
  try {
    response.headers.set("X-Robots-Tag", CAMP_HQ_ROBOTS_HEADER);
    return response;
  } catch {
    // Responses such as Response.redirect() have read-only headers.
    const copy = new NextResponse(response.body, response);
    copy.headers.set("X-Robots-Tag", CAMP_HQ_ROBOTS_HEADER);
    return copy;
  }
}
