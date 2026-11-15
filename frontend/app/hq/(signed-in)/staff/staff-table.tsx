"use client";

// Every staff member as a row: the name and role edit in the cell, the account
// actions sit in the row's menu, and the blank row adds a person. The server
// actions enforce who may change what.
import { MoreHorizontal } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/hq-ui/button";
import { Input } from "@/components/hq-ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StaffListEntry } from "@/lib/hq/operations";
import { cn } from "@/lib/utils";

import { EditableTable } from "../editable-table/editable-table";
import type { CellResult, EditableColumn, EditableOption } from "../editable-table/types";
import {
  addStaffMember,
  createStaffAccount,
  removeStaffMember,
  renameStaffMember,
  setStaffRole,
  switchStaffAccount,
} from "../table-actions";

const kindLabels = { senior: "Senior staff", junior: "Junior staff" } as const;

const kindOptions: EditableOption[] = [
  { value: "senior", label: "Senior staff" },
  { value: "junior", label: "Junior staff", note: "no account" },
];

const roleOptions: EditableOption[] = [
  { value: "admin", label: "Admin" },
  { value: "senior_staff", label: "Senior staff" },
];

const roleLabels: Record<string, string> = { admin: "Admin", senior_staff: "Senior staff" };

const statusLook = {
  active: { label: "Active", className: "bg-primary/10 text-primary" },
  invited: { label: "Invited", className: "bg-amber-100 text-amber-900" },
  "switched-off": { label: "Switched off", className: "bg-foreground/10 text-muted-foreground" },
  none: { label: "No account", className: "bg-foreground/5 text-muted-foreground" },
} as const;

const notEditable = async (): Promise<CellResult> => ({ ok: false, error: "Not editable." });

function AccountCell({ row }: { row: StaffListEntry }) {
  const look = statusLook[row.account?.status ?? "none"];
  return (
    <span className="flex min-h-8 items-center gap-2 px-2">
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-sm px-1.5 py-0.5 text-xs font-medium",
          look.className,
        )}
      >
        {look.label}
      </span>
      {row.account?.email ? (
        <span className="truncate text-muted-foreground">{row.account.email}</span>
      ) : null}
    </span>
  );
}

type Asking =
  | { kind: "account" }
  | { kind: "switch-off" }
  | { kind: "remove" }
  | null;

/** The row's menu: account actions, and removing the person. */
function StaffActions({ row }: { row: StaffListEntry }) {
  const [asking, setAsking] = useState<Asking>(null);
  const [email, setEmail] = useState(row.account?.email ?? "");
  const [pending, startTransition] = useTransition();
  const { account } = row;
  const hasAccount = account && account.status !== "invited";

  function run(action: () => Promise<CellResult & { message?: string }>, done: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message || done);
        setAsking(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          {!hasAccount ? (
            <DropdownMenuItem onSelect={() => setAsking({ kind: "account" })}>
              {account?.status === "invited" ? "Send the invitation again" : "Create account"}
            </DropdownMenuItem>
          ) : account.status === "switched-off" ? (
            <DropdownMenuItem
              onSelect={() => run(() => switchStaffAccount(row.id, true), "Account switched on.")}
            >
              Switch account on
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setAsking({ kind: "switch-off" })}>
              Switch account off
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setAsking({ kind: "remove" })}>
            Remove from Camp HQ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={asking !== null} onOpenChange={(open) => !open && setAsking(null)}>
        <DialogContent className="sm:max-w-md">
          {asking?.kind === "account" ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                run(() => createStaffAccount(row.id, email), "Saved.");
              }}
            >
              <DialogHeader>
                <DialogTitle>Account for {row.name}</DialogTitle>
                <DialogDescription>
                  {row.kind === "junior"
                    ? "Junior staff have no account as a rule. Give one only as an exception."
                    : "They sign in with this email. Without a Clerk user yet, they get an invitation."}
                </DialogDescription>
              </DialogHeader>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Email</span>
                <Input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAsking(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {account?.status === "invited" ? "Send again" : "Create account"}
                </Button>
              </DialogFooter>
            </form>
          ) : asking ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {asking.kind === "remove"
                    ? `Remove ${row.name} from Camp HQ?`
                    : `Switch off ${row.name}'s account?`}
                </DialogTitle>
                <DialogDescription>
                  {asking.kind === "remove"
                    ? "Their staff record goes, with any leader, specialist or helper Assignment."
                    : "They will not be able to sign in until an Admin switches it on again."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAsking(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={pending}
                  onClick={() =>
                    asking.kind === "remove"
                      ? run(() => removeStaffMember(row.id), `Removed ${row.name}.`)
                      : run(() => switchStaffAccount(row.id, false), "Account switched off.")
                  }
                >
                  {asking.kind === "remove" ? "Remove" : "Switch off"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StaffTable({ rows }: { rows: StaffListEntry[] }) {
  const columns: EditableColumn<StaffListEntry>[] = [
    {
      id: "name",
      header: "Name",
      type: "text",
      className: "w-64",
      maxLength: 100,
      placeholder: "Name",
      value: (row) => row.name,
      display: (row) => row.name,
      save: (row, name) => renameStaffMember(row.id, name),
    },
    {
      id: "kind",
      header: "Staff",
      type: "select",
      className: "w-36",
      // Senior or Junior is set when the person is added.
      editable: () => false,
      value: (row) => row.kind,
      display: (row) => kindLabels[row.kind],
      options: () => kindOptions,
      save: notEditable,
    },
    {
      id: "account",
      header: "Account",
      type: "custom",
      render: (row) => <AccountCell row={row} />,
    },
    {
      id: "role",
      header: "Role",
      type: "select",
      className: "w-52",
      editable: (row) => row.account?.status === "active",
      value: (row) => row.account?.role ?? "",
      display: (row) => (row.account?.role ? roleLabels[row.account.role] : "—"),
      options: () => roleOptions,
      save: (row, role) => setStaffRole(row.id, role),
    },
  ];

  return (
    <EditableTable
      caption="Camp HQ staff and their accounts"
      rows={rows}
      rowId={(row) => row.id}
      rowLabel={(row) => row.name}
      columns={columns}
      emptyText="No staff yet."
      rowActions={(row) => <StaffActions row={row} />}
      addRow={{
        label: "New staff member",
        hint: "",
        columns: ["name", "kind"],
        options: { kind: kindOptions },
        fill: (draft, changed) =>
          changed === "name" && !draft.kind ? { ...draft, kind: "senior" } : draft,
        isComplete: (draft) => Boolean(draft.name?.trim() && draft.kind),
        save: (draft) => addStaffMember({ name: draft.name!, kind: draft.kind! }),
      }}
    />
  );
}
