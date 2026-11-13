"use client";

import { SignOutButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { CAMP_HQ_SIGN_IN_PATH } from "@/lib/hq/config";

export function CampHqSignOutButton() {
  return (
    <SignOutButton redirectUrl={CAMP_HQ_SIGN_IN_PATH}>
      <Button variant="outline">Sign out</Button>
    </SignOutButton>
  );
}
