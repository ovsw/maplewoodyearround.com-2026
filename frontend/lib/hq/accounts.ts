// The one small interface between Camp HQ and the service that holds sign-in
// accounts (Clerk). The operations module only talks to accounts through it,
// so its tests use a fake and never reach Clerk.

/** What happened when Camp HQ asked for an account. */
export type AccountCreation =
  /** The account exists (newly made, or one that already used this email). */
  | { status: "created"; clerkUserId: string }
  /** Direct creation was refused; an invitation email went out instead. */
  | { status: "invited" };

export interface CampHqAccounts {
  /** Gives the person a sign-in account for this email, or invites them. */
  createAccount(person: { email: string; name: string }): Promise<AccountCreation>;
  /** Allows or blocks sign-in for an account. Blocking also ends its sessions. */
  setSignInAllowed(clerkUserId: string, allowed: boolean): Promise<void>;
}
