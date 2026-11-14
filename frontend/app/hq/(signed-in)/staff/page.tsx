import type { Metadata } from "next";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CampHqDatabaseUnavailable,
  getCampHqOperations,
} from "@/lib/hq/camp-hq";
import { campHqNow } from "@/lib/hq/clock";
import { getCampHqClerkKeys } from "@/lib/hq/config";
import {
  campHqRoleLabels,
  isCampHqRefusal,
  type StaffListEntry,
} from "@/lib/hq/operations";
import { requireCampHqActor } from "@/lib/hq/session";

import { StaffForm } from "./staff-form";

export const metadata: Metadata = { title: "Staff and accounts" };

const kindLabels = { senior: "Senior staff", junior: "Junior staff" } as const;

const selectClassName =
  "border-input flex min-h-(--control-height) rounded-control border bg-transparent px-4 py-3 text-base focus-field";

export default function StaffPage() {
  return (
    <Suspense fallback={null}>
      <Staff />
    </Suspense>
  );
}

type StaffState =
  | { kind: "staff"; staff: StaffListEntry[] }
  | { kind: "refused"; message: string }
  | { kind: "no-database" };

async function loadStaff(): Promise<StaffState> {
  const actor = await requireCampHqActor();
  try {
    const campHq = await getCampHqOperations();
    return { kind: "staff", staff: await campHq.listStaff({ actor, now: campHqNow() }) };
  } catch (error) {
    if (isCampHqRefusal(error)) return { kind: "refused", message: error.message };
    if (error instanceof CampHqDatabaseUnavailable) return { kind: "no-database" };
    throw error;
  }
}

async function Staff() {
  if (!getCampHqClerkKeys()) return null;
  const state = await loadStaff();

  if (state.kind !== "staff") {
    return (
      <section className="flex max-w-xl flex-col gap-3">
        <h1 className="text-title-lg">Staff and accounts</h1>
        <p className="text-muted-foreground">
          {state.kind === "refused"
            ? state.message
            : "Camp HQ's database is not set up on this site yet."}
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-title-lg">Staff and accounts</h1>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
        <h2 className="text-label">Add a staff member</h2>
        <StaffForm intent="add">
          <label className="flex min-w-64 flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium">Name</span>
            <Input name="name" required maxLength={100} autoComplete="off" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Staff</span>
            <select name="kind" defaultValue="senior" className={selectClassName}>
              <option value="senior">Senior staff</option>
              <option value="junior">Junior staff (no account)</option>
            </select>
          </label>
          <Button type="submit">Add</Button>
        </StaffForm>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-label">
          Staff <span className="text-muted-foreground">({state.staff.length})</span>
        </h2>
        <ul className="flex flex-col gap-3">
          {state.staff.map((entry) => (
            <StaffRow key={entry.id} entry={entry} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function accountSummary({ account }: StaffListEntry) {
  if (!account) return "No account";
  if (account.status === "invited") return `Invited: ${account.email}`;
  const role = account.role ? campHqRoleLabels[account.role] : "";
  const who = account.email ?? "account";
  return account.status === "switched-off"
    ? `${who} · switched off`
    : `${who} · ${role}`;
}

function StaffRow({ entry }: { entry: StaffListEntry }) {
  const { account } = entry;
  const hasAccount = account && account.status !== "invited";

  return (
    <li className="grid gap-4 rounded-lg border border-border bg-card p-5 lg:grid-cols-2">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{entry.name}</h3>
        <p className="text-sm text-muted-foreground">
          {kindLabels[entry.kind]} · {accountSummary(entry)}
        </p>
        <StaffForm intent="rename" staffMemberId={entry.id} className="mt-2">
          <label className="flex min-w-48 flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium">Name</span>
            <Input name="name" defaultValue={entry.name} required maxLength={100} />
          </label>
          <Button type="submit" variant="outline">
            Rename
          </Button>
        </StaffForm>
      </div>

      <div className="flex flex-col gap-2">
        {!hasAccount ? (
          <StaffForm intent="create-account" staffMemberId={entry.id}>
            <label className="flex min-w-48 flex-1 flex-col gap-1.5">
              <span className="text-sm font-medium">
                {entry.kind === "junior" ? "Email (account as an exception)" : "Email"}
              </span>
              <Input
                type="email"
                name="email"
                required
                autoComplete="off"
                defaultValue={account?.email ?? ""}
              />
            </label>
            <Button type="submit" variant="outline">
              {account?.status === "invited" ? "Send again" : "Create account"}
            </Button>
          </StaffForm>
        ) : account.status === "switched-off" ? (
          <StaffForm intent="switch-on" staffMemberId={entry.id}>
            <Button type="submit" variant="outline">
              Switch account on
            </Button>
          </StaffForm>
        ) : (
          <div className="flex flex-wrap gap-3">
            <StaffForm intent="set-role" staffMemberId={entry.id}>
              <input
                type="hidden"
                name="role"
                value={account.role === "admin" ? "senior_staff" : "admin"}
              />
              <Button type="submit" variant="outline">
                {account.role === "admin" ? "Remove Admin role" : "Make Admin"}
              </Button>
            </StaffForm>
            <StaffForm
              intent="switch-off"
              staffMemberId={entry.id}
              confirmMessage={`Switch off ${entry.name}'s account? They will not be able to sign in.`}
            >
              <Button type="submit" variant="outline">
                Switch account off
              </Button>
            </StaffForm>
          </div>
        )}
        <StaffForm
          intent="remove"
          staffMemberId={entry.id}
          confirmMessage={`Remove ${entry.name} from Camp HQ?`}
        >
          <Button type="submit" variant="ghost">
            Remove
          </Button>
        </StaffForm>
      </div>
    </li>
  );
}
