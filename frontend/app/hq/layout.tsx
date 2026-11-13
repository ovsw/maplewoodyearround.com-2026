import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import {
  CAMP_HQ_PATH,
  CAMP_HQ_SIGN_IN_PATH,
  getCampHqClerkKeys,
} from "@/lib/hq/config";

export const metadata: Metadata = {
  title: { template: "%s | Camp HQ", default: "Camp HQ" },
  robots: { index: false, follow: false },
};

// Camp HQ's own frame: no Website header or footer. Clerk loads here and
// nowhere else, so public pages stay free of sign-in code.
export default function CampHqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const keys = getCampHqClerkKeys();

  return (
    <div className="field-white min-h-dvh bg-background text-foreground">
      {keys ? (
        <ClerkProvider
          publishableKey={keys.publishableKey}
          signInUrl={CAMP_HQ_SIGN_IN_PATH}
          signInFallbackRedirectUrl={CAMP_HQ_PATH}
          afterSignOutUrl={CAMP_HQ_SIGN_IN_PATH}
        >
          {children}
        </ClerkProvider>
      ) : (
        <CampHqUnavailable />
      )}
    </div>
  );
}

function CampHqUnavailable() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-3 px-6">
      <h1 className="text-title">Camp HQ is not available</h1>
      <p className="text-muted-foreground">
        Camp HQ is not set up on this site yet.
      </p>
    </main>
  );
}
