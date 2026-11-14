"use client";

import { useActionState, useState } from "react";

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
  // A confirmation is for the selection it was asked about. Changing a field
  // withdraws it, so the Admin has to Save again before replacing.
  const [withdrawn, setWithdrawn] = useState<AssignmentActionState>(null);
  const confirm = !pending && state?.confirm && withdrawn !== state ? state.confirm : null;
  const message = pending ? "Saving…" : (state?.error ?? state?.ok ?? "");

  return (
    <form
      action={formAction}
      onChange={() => {
        if (state?.confirm) setWithdrawn(state);
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="intent" value={intent} />
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <fieldset disabled={pending} className={cn("flex flex-wrap items-end gap-3", className)}>
        {children}
      </fieldset>
      {confirm ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-control border border-border bg-muted p-3"
        >
          <p className="text-sm">{confirm.message}</p>
          <input type="hidden" name="confirmedStaffMemberId" value={confirm.staffMemberId} />
          <input type="hidden" name="replacingStaffMemberId" value={confirm.incumbentId} />
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
