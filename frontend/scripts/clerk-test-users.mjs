// Creates the Camp HQ test users in Clerk when they are missing. Safe to run
// again: an existing user is left as it is.
//
//   pnpm --dir frontend hq:test-users
//
// Reads CLERK_SECRET_KEY (frontend/.env.local). The emails contain
// `+clerk_test`, so Clerk's testing mode signs them in without a password or
// a real inbox. Roles live in Camp HQ's own database, not in Clerk.
import { pathToFileURL } from "node:url";

const CLERK_API_URL = "https://api.clerk.com/v1";

/** Invented sample people, one per Camp HQ role used in tests. */
export const campHqTestUsers = [
  {
    role: "Admin",
    emailAddress: "camp-hq-admin+clerk_test@example.com",
    firstName: "Sample",
    lastName: "Admin",
  },
  {
    role: "Group leader",
    emailAddress: "camp-hq-leader+clerk_test@example.com",
    firstName: "Sample",
    lastName: "Leader",
  },
];

async function clerkRequest(fetchImpl, secretKey, path, init = {}) {
  const response = await fetchImpl(`${CLERK_API_URL}${path}`, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      body?.errors?.map((error) => error.long_message ?? error.message).join("; ") ||
      response.statusText;
    throw new Error(`Clerk ${init.method ?? "GET"} ${path} failed (${response.status}): ${detail}`);
  }
  return body;
}

/**
 * Makes sure every Camp HQ test user exists. Returns one line per user saying
 * whether it was created or already there.
 */
export async function ensureClerkTestUsers({
  secretKey,
  fetch: fetchImpl = globalThis.fetch,
  users = campHqTestUsers,
}) {
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is missing.");
  // Test users sign in with a fixed code, so they never go into production.
  if (secretKey.startsWith("sk_live_")) {
    throw new Error(
      "CLERK_SECRET_KEY is a production key. Use the development instance's key.",
    );
  }
  const results = [];
  for (const user of users) {
    const query = new URLSearchParams({ email_address: user.emailAddress });
    const existing = await clerkRequest(fetchImpl, secretKey, `/users?${query}`);
    if (Array.isArray(existing) && existing.length > 0) {
      results.push({ ...user, id: existing[0].id, created: false });
      continue;
    }
    const created = await clerkRequest(fetchImpl, secretKey, "/users", {
      method: "POST",
      body: JSON.stringify({
        email_address: [user.emailAddress],
        first_name: user.firstName,
        last_name: user.lastName,
        skip_password_requirement: true,
      }),
    });
    results.push({ ...user, id: created.id, created: true });
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const results = await ensureClerkTestUsers({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    for (const { role, emailAddress, created } of results) {
      console.log(`${role}: ${emailAddress} ${created ? "created" : "already exists"}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
