import Link from "next/link";

import { CAMP_HQ_PATH } from "@/lib/hq/config";

import { CampHqSignOutButton } from "./sign-out-button";

// Every Camp HQ page after sign-in: a plain bar with the sign-out control.
export default function CampHqSignedInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Link
            href={CAMP_HQ_PATH}
            className="focus-ring inline-flex min-h-11 items-center rounded-control text-label"
          >
            Camp HQ
          </Link>
          <CampHqSignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </>
  );
}
