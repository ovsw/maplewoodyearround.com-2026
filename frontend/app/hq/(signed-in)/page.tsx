import type { Metadata } from "next";
import { Suspense } from "react";

import { getCampHqClerkKeys } from "@/lib/hq/config";
import { requireCampHqUserId } from "@/lib/hq/session";

export const metadata: Metadata = { title: { absolute: "Camp HQ" } };

export default function CampHqHomePage() {
  return (
    <Suspense fallback={null}>
      <CampHqHome />
    </Suspense>
  );
}

async function CampHqHome() {
  // Without Clerk keys the layout shows "not available"; auth() would throw.
  if (!getCampHqClerkKeys()) return null;
  await requireCampHqUserId();
  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-title-lg">Camp HQ</h1>
      <p className="text-muted-foreground">Nothing to show here yet.</p>
    </section>
  );
}
