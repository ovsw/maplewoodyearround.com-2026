import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

import { CAMP_HQ_PATH, CAMP_HQ_SIGN_IN_PATH } from "@/lib/hq/config";

export const metadata: Metadata = { title: "Sign in" };

// Accounts are created by an Admin, so there is no sign-up link or page.
export default function CampHqSignInPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-10">
      <h1 className="text-title">Camp HQ</h1>
      {/* The form reads the URL, which only exists at request time. */}
      <Suspense fallback={null}>
        <SignIn
          routing="path"
          path={CAMP_HQ_SIGN_IN_PATH}
          fallbackRedirectUrl={CAMP_HQ_PATH}
          withSignUp={false}
          appearance={{ elements: { footerAction: { display: "none" } } }}
        />
      </Suspense>
    </main>
  );
}
