// Camp HQ accounts on Clerk, through Clerk's Backend API. Only the operations
// module uses it, behind the CampHqAccounts interface.
import type { AccountCreation, CampHqAccounts } from "./accounts.ts";

const CLERK_API_URL = "https://api.clerk.com/v1";

type ClerkError = { code?: string; message?: string; long_message?: string };

export class ClerkRequestFailed extends Error {
  readonly status: number;
  readonly codes: string[];

  constructor(method: string, path: string, status: number, errors: ClerkError[]) {
    const detail =
      errors.map((error) => error.long_message ?? error.message).filter(Boolean).join("; ") ||
      "no detail";
    super(`Clerk ${method} ${path} failed (${status}): ${detail}`);
    this.name = "ClerkRequestFailed";
    this.status = status;
    this.codes = errors.map((error) => error.code ?? "").filter(Boolean);
  }
}

/**
 * True when Clerk refused to create the user itself, as it can while sign-up
 * is restricted. An email already in use is not a refusal of this kind.
 */
function isCreationRefused(error: unknown) {
  if (!(error instanceof ClerkRequestFailed)) return false;
  if (error.codes.includes("form_identifier_exists")) return false;
  return (
    error.status === 403 ||
    error.codes.some((code) => /restrict|not_allowed|sign_up/i.test(code))
  );
}

function splitName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  return { first_name: first, last_name: rest.join(" ") || undefined };
}

export function createClerkAccounts(
  secretKey: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): CampHqAccounts {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetchImpl(`${CLERK_API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await response.json().catch(() => null)) as
      | (T & { errors?: ClerkError[] })
      | null;
    if (!response.ok) {
      throw new ClerkRequestFailed(method, path, response.status, json?.errors ?? []);
    }
    return json as T;
  }

  return {
    async createAccount({ email, name }): Promise<AccountCreation> {
      const query = new URLSearchParams({ email_address: email });
      const existing = await request<{ id: string }[]>("GET", `/users?${query}`);
      if (existing[0]) return { status: "created", clerkUserId: existing[0].id };

      try {
        const user = await request<{ id: string }>("POST", "/users", {
          email_address: [email],
          skip_password_requirement: true,
          ...splitName(name),
        });
        return { status: "created", clerkUserId: user.id };
      } catch (error) {
        if (!isCreationRefused(error)) throw error;
      }
      await request("POST", "/invitations", {
        email_address: email,
        notify: true,
        // Asking again re-sends rather than failing on the pending invitation.
        ignore_existing: true,
      });
      return { status: "invited" };
    },

    async setSignInAllowed(clerkUserId, allowed) {
      const action = allowed ? "unban" : "ban";
      await request("POST", `/users/${encodeURIComponent(clerkUserId)}/${action}`);
    },
  };
}
