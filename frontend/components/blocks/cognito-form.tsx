"use client";

import { useEffect, useRef } from "react";

// Cognito's public loader. The form and account identifiers are content.
const LOADER = "https://www.cognitoforms.com/f/seamless.js";

declare global {
  interface Window {
    Cognito?: { prefill?: (values: Record<string, string>) => void };
  }
}

/** The Cognito "seamless" form, with the program pre-filled as on the live site. */
export default function CognitoForm({
  accountId,
  formId,
  sentFrom,
}: {
  accountId: string;
  formId: string;
  sentFrom?: string | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const script = document.createElement("script");
    script.src = LOADER;
    script.dataset.key = accountId;
    script.dataset.form = formId;
    script.addEventListener("load", () => {
      if (sentFrom) window.Cognito?.prefill?.({ SentFrom: sentFrom });
    });
    node.append(script);
    return () => node.replaceChildren();
  }, [accountId, formId, sentFrom]);
  return <div ref={container} />;
}
