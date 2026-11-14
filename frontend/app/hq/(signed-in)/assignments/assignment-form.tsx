"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { assignmentAction, type AssignmentActionState } from "./actions";

/**
 * A form on the Assignments page. Sends `intent` and the hidden ids with its
 * own fields, shows the result or the refusal, and asks before replacing a
 * leader or specialist.
 */
export function AssignmentForm({
  intent,
  hidden,
  className,
  children,
}: {
  intent: string;
  hidden: Record<string, string>;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<AssignmentActionState, FormData>(
    assignmentAction,
    null,
  );
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
      {!pending && state?.confirm ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-control border border-border bg-muted p-3"
        >
          <p className="text-sm">{state.confirm.message}</p>
          <input
            type="hidden"
            name="confirmedStaffMemberId"
            value={state.confirm.staffMemberId}
          />
          <Button type="submit" name="replace" value="1" variant="outline">
            Replace
          </Button>
        </div>
      ) : (
        <p
          role={!pending && state?.error ? "alert" : "status"}
          className={cn(
            "text-sm",
            !pending && state?.error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {message}
        </p>
      )}
    </form>
  );
}
