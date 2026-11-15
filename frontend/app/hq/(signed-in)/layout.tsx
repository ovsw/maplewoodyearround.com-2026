import { Suspense } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCampHqClerkKeys } from "@/lib/hq/config";

import { HqHeader } from "./app-shell/hq-header";
import { HqSidebar } from "./app-shell/hq-sidebar";
import { LoadedSidebar } from "./app-shell/loaded-sidebar";
import { EVERYONE } from "./app-shell/nav";
import { NavGroupsProvider } from "./app-shell/nav-context";

// Every Camp HQ page after sign-in: the sidebar with the main menu stays on the
// left (a drawer on phones), with the page beside it. Printing shows the page only.
export default function CampHqSignedInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavGroupsProvider>
      <SidebarProvider className="print:block print:[&_[data-slot=sidebar]]:hidden">
        {getCampHqClerkKeys() ? (
          <Suspense fallback={<HqSidebar groups={EVERYONE} person={null} />}>
            <LoadedSidebar />
          </Suspense>
        ) : null}
        <SidebarInset className="@container/main min-w-0">
          <HqHeader />
          <main className="w-full max-w-6xl px-6 py-8 print:max-w-none print:p-0">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </NavGroupsProvider>
  );
}
