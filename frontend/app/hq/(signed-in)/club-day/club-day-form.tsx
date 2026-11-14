"use client";

import { useActionState } from "react";

import { cn } from "@/lib/utils";

import { clubDayAction, type ClubDayActionState } from "./actions";

/**
 * A form on the Club day page. Sends `intent` and the hidden ids with its own
 * fields, and shows the result or the refusal under the fields.
 */
export function ClubDayForm({
  intent,
  hidden = {},
  className,
  children,
}: {
  intent: string;
  hidden?: Record<string, string>;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<ClubDayActionState, FormData>(
    clubDayAction,
    null,
  );
  const failed = !pending && Boolean(state?.error);
  const message = pending ? "Saving…" : (state?.error ?? state?.ok ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="intent" value={intent} />
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <fieldset disabled={pending} className={cn("flex flex-wrap items-end gap-3", className)}>
        {children}
      </fieldset>
      <p
        role={failed ? "alert" : "status"}
        className={cn("text-sm", failed ? "text-destructive" : "text-muted-foreground")}
      >
        {message}
      </p>
    </form>
  );
}
