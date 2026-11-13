// Makes a person a Camp HQ Admin by the email of their Clerk account. Use it
// for the first Admin; after that Admins manage roles inside Camp HQ.
//
//   pnpm --dir frontend hq:make-admin someone@example.com
//   CAMP_HQ_DATABASE=neon pnpm --dir frontend hq:make-admin someone@example.com
//
// Without CAMP_HQ_DATABASE=neon it writes to the local worktree database (stop
// the dev server first). With it, it writes to the Neon database in
// DATABASE_URL, which must already have the migrations (hq:db:migrate).
// CLERK_SECRET_KEY must belong to the Clerk instance the person signs in to.
import {
  getCampHqDatabaseMode,
  neonDatabaseUrl,
  openNeonDatabase,
} from "../lib/hq/db/database.ts";
import { openLocalCampHqDatabase } from "../lib/hq/db/local.ts";
import { createCampHqOperations } from "../lib/hq/operations.ts";

type ClerkUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

async function findClerkUser(secretKey: string, email: string) {
  const query = new URLSearchParams({ email_address: email });
  const response = await fetch(`https://api.clerk.com/v1/users?${query}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!response.ok) {
    throw new Error(`Clerk user lookup failed (${response.status} ${response.statusText}).`);
  }
  const users = (await response.json()) as ClerkUser[];
  return users[0];
}

async function main() {
  const email = process.argv[2]?.trim();
  if (!email) throw new Error("Usage: pnpm --dir frontend hq:make-admin <email>");
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is missing.");

  const user = await findClerkUser(secretKey, email);
  if (!user) {
    throw new Error(
      `No Clerk account uses ${email}. Create the user in the Clerk dashboard first.`,
    );
  }
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || email;

  const mode = getCampHqDatabaseMode();
  const database =
    mode === "neon"
      ? await openNeonDatabase(neonDatabaseUrl())
      : await openLocalCampHqDatabase();
  try {
    const result = await createCampHqOperations(database.db).makeAdmin(
      { actor: { type: "command-line" }, now: new Date() },
      { clerkUserId: user.id, name },
    );
    console.log(
      `${name} (${email}) is now an Admin in the ${mode} database` +
        (result.created ? " (new staff record)." : "."),
    );
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
