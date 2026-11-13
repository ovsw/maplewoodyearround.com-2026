"use client";

import { useActionState } from "react";

import { cn } from "@/lib/utils";

import { staffAction, type StaffActionState } from "./actions";

/**
 * A form on the staff page. Sends `intent` and the staff member's id with its
 * own fields, and shows the result or the refusal next to the controls.
 */
export function StaffForm({
  intent,
  staffMemberId,
  confirmMessage,
  className,
  children,
}: {
  intent: string;
  staffMemberId?: string;
  /** Asked before sending, for changes that are hard to undo. */
  confirmMessage?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<StaffActionState, FormData>(
    staffAction,
    null,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="intent" value={intent} />
      {staffMemberId ? (
        <input type="hidden" name="staffMemberId" value={staffMemberId} />
      ) : null}
      <fieldset disabled={pending} className={cn("flex flex-wrap items-end gap-3", className)}>
        {children}
      </fieldset>
      <p
        role={!pending && state?.error ? "alert" : "status"}
        className={cn(
          "text-sm",
          !pending && state?.error ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {pending ? "Saving…" : (state?.error ?? state?.ok ?? "")}
      </p>
    </form>
  );
}
