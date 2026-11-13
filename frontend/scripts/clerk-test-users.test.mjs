import assert from "node:assert/strict";
import test from "node:test";

import { campHqTestUsers, ensureClerkTestUsers } from "./clerk-test-users.mjs";

// An in-memory stand-in for Clerk's user API.
function fakeClerk() {
  const users = [];
  const calls = [];
  const fetch = async (url, init = {}) => {
    const { pathname, searchParams } = new URL(url);
    calls.push(`${init.method ?? "GET"} ${pathname}`);
    if (!init.method) {
      const email = searchParams.get("email_address");
      const found = users.filter((user) => user.email_address.includes(email));
      return Response.json(found);
    }
    const body = JSON.parse(init.body);
    const user = { id: `user_${users.length + 1}`, ...body };
    users.push(user);
    return Response.json(user);
  };
  return { users, calls, fetch };
}

test("every test user is invented and uses Clerk's test email form", () => {
  assert.equal(campHqTestUsers.length, 2);
  for (const user of campHqTestUsers) {
    assert.match(user.emailAddress, /\+clerk_test@example\.com$/);
  }
});

test("creates missing test users without a password", async () => {
  const clerk = fakeClerk();

  const results = await ensureClerkTestUsers({ secretKey: "sk_test_x", fetch: clerk.fetch });

  assert.deepEqual(results.map(({ created }) => created), [true, true]);
  assert.equal(clerk.users.length, 2);
  for (const user of clerk.users) {
    assert.equal(user.skip_password_requirement, true);
    assert.equal(user.password, undefined);
  }
});

test("running twice creates nobody the second time", async () => {
  const clerk = fakeClerk();

  await ensureClerkTestUsers({ secretKey: "sk_test_x", fetch: clerk.fetch });
  const second = await ensureClerkTestUsers({ secretKey: "sk_test_x", fetch: clerk.fetch });

  assert.deepEqual(second.map(({ created }) => created), [false, false]);
  assert.equal(clerk.users.length, 2);
  assert.equal(clerk.calls.filter((call) => call.startsWith("POST")).length, 2);
});

test("reports Clerk's error message", async () => {
  const fetch = async () =>
    Response.json({ errors: [{ message: "x", long_message: "Sign-ups are restricted" }] }, { status: 422 });

  await assert.rejects(
    ensureClerkTestUsers({ secretKey: "sk_test_x", fetch }),
    /422\): Sign-ups are restricted/,
  );
});

test("refuses a production secret key", async () => {
  await assert.rejects(
    ensureClerkTestUsers({ secretKey: "sk_live_x", fetch: () => assert.fail("no request") }),
    /production key/,
  );
});

test("refuses to run without a secret key", async () => {
  await assert.rejects(ensureClerkTestUsers({ secretKey: "" }), /CLERK_SECRET_KEY is missing/);
});
