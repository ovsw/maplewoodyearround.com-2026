"use client";

import { useEffect, useState, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { disableDraftMode } from "@/app/actions/disable-draft-mode";

export function DisableDraftMode() {
  const [pending, startTransition] = useTransition();
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Defer iframe detection until the browser is available.
    setIsInIframe(window.self !== window.top);
  }, []);

  // Hide only inside a Studio iframe pane. A tab opened from Presentation
  // also counts as the Presentation Tool, and editors need the button there.
  if (isInIframe) return null;

  return (
    <button
      className={cn(
        buttonVariants({ size: "compact" }),
        "fixed z-9999 bottom-4 right-4 cursor-pointer",
      )}
      disabled={pending}
      onClick={() => startTransition(() => disableDraftMode())}
    >
      {pending ? "Disabling..." : "Disable Draft Mode"}
    </button>
  );
}
