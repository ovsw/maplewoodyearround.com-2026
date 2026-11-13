import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { CAMP_HQ_SIGN_IN_PATH } from "@/lib/hq/config";

/**
 * The signed-in person's Clerk user id. Pages check it themselves as well as
 * the request proxy, so Camp HQ never relies on the proxy alone.
 */
export async function requireCampHqUserId() {
  const { userId } = await auth();
  if (!userId) redirect(CAMP_HQ_SIGN_IN_PATH);
  return userId;
}
