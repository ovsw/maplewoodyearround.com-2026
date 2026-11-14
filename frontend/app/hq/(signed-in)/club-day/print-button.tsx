"use client";

import { Button } from "@/components/ui/button";

/** Opens the browser's print dialog. Hidden on the printed page. */
export function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <Button type="button" className="self-start print:hidden" onClick={() => window.print()}>
      {children}
    </Button>
  );
}
