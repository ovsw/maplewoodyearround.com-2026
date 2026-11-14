// A stand-in for the sign-in service (Clerk) in Camp HQ tests. It keeps its
// accounts in memory and can be told to refuse direct creation, as Clerk may
// while sign-up is restricted.
import type { AccountCreation, CampHqAccounts } from "../accounts.ts";

export function createFakeAccounts() {
  const users = new Map<string, { email: string | null; signInAllowed: boolean }>();
  const invitations: string[] = [];
  let refusingDirectCreation = false;
  let nextId = 1;

  const accounts: CampHqAccounts = {
    async createAccount({ email }): Promise<AccountCreation> {
      for (const [id, user] of users) {
        if (user.email === email) return { status: "created", clerkUserId: id };
      }
      if (refusingDirectCreation) {
        invitations.push(email);
        return { status: "invited" };
      }
      const clerkUserId = `user_fake_${nextId++}`;
      users.set(clerkUserId, { email, signInAllowed: true });
      return { status: "created", clerkUserId };
    },

    async setSignInAllowed(clerkUserId, allowed) {
      const user = users.get(clerkUserId) ?? { email: null, signInAllowed: true };
      users.set(clerkUserId, { ...user, signInAllowed: allowed });
    },
  };

  return {
    accounts,
    /** Emails that were sent an invitation instead of getting an account. */
    invitations,
    refuseDirectCreation() {
      refusingDirectCreation = true;
    },
    /** An account that already exists in the sign-in service. */
    addExistingUser(email: string) {
      const clerkUserId = `user_fake_${nextId++}`;
      users.set(clerkUserId, { email, signInAllowed: true });
      return clerkUserId;
    },
    /** The account created for this email, if any. */
    userIdFor(email: string) {
      for (const [id, user] of users) if (user.email === email) return id;
      return undefined;
    },
    canSignIn(clerkUserId: string) {
      return users.get(clerkUserId)?.signInAllowed ?? true;
    },
  };
}
