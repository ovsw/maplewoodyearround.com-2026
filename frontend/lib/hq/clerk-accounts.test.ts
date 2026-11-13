// @vitest-environment node
import { describe, expect, it } from "vitest";

import { createClerkAccounts } from "./clerk-accounts";

type Call = { method: string; path: string; body: unknown };

/** A fetch that answers Clerk paths from a table and records every call. */
function fakeClerk(answers: Record<string, { status: number; body: unknown }>) {
  const calls: Call[] = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const path = url.pathname.replace("/v1", "");
    calls.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const answer = answers[`${method} ${path}`] ?? { status: 404, body: { errors: [] } };
    return new Response(JSON.stringify(answer.body), { status: answer.status });
  }) as typeof fetch;
  return { calls, accounts: createClerkAccounts("sk_test_fake", fetchImpl) };
}

describe("Camp HQ accounts on Clerk", () => {
  it("links an existing user with the email", async () => {
    const clerk = fakeClerk({ "GET /users": { status: 200, body: [{ id: "user_1" }] } });

    await expect(
      clerk.accounts.createAccount({ email: "rowan@example.com", name: "Rowan Birch" }),
    ).resolves.toEqual({ status: "created", clerkUserId: "user_1" });
    expect(clerk.calls.map((call) => call.method)).toEqual(["GET"]);
  });

  it("creates the user directly", async () => {
    const clerk = fakeClerk({
      "GET /users": { status: 200, body: [] },
      "POST /users": { status: 200, body: { id: "user_2" } },
    });

    await expect(
      clerk.accounts.createAccount({ email: "rowan@example.com", name: "Rowan Birch" }),
    ).resolves.toEqual({ status: "created", clerkUserId: "user_2" });
    expect(clerk.calls[1].body).toMatchObject({
      email_address: ["rowan@example.com"],
      first_name: "Rowan",
      last_name: "Birch",
    });
  });

  it("sends an invitation when direct creation is refused", async () => {
    const clerk = fakeClerk({
      "GET /users": { status: 200, body: [] },
      "POST /users": { status: 403, body: { errors: [{ code: "sign_up_restricted" }] } },
      "POST /invitations": { status: 200, body: { id: "inv_1" } },
    });

    await expect(
      clerk.accounts.createAccount({ email: "rowan@example.com", name: "Rowan Birch" }),
    ).resolves.toEqual({ status: "invited" });
    expect(clerk.calls[2].body).toMatchObject({ email_address: "rowan@example.com" });
  });

  it("does not invite on other errors", async () => {
    const clerk = fakeClerk({
      "GET /users": { status: 200, body: [] },
      "POST /users": {
        status: 422,
        body: { errors: [{ code: "form_param_format_invalid", message: "bad email" }] },
      },
    });

    await expect(
      clerk.accounts.createAccount({ email: "rowan@example.com", name: "Rowan Birch" }),
    ).rejects.toThrow(/bad email/);
    expect(clerk.calls).toHaveLength(2);
  });

  it("bans and unbans to switch sign-in off and on", async () => {
    const clerk = fakeClerk({
      "POST /users/user_1/ban": { status: 200, body: {} },
      "POST /users/user_1/unban": { status: 200, body: {} },
    });

    await clerk.accounts.setSignInAllowed("user_1", false);
    await clerk.accounts.setSignInAllowed("user_1", true);

    expect(clerk.calls.map((call) => call.path)).toEqual([
      "/users/user_1/ban",
      "/users/user_1/unban",
    ]);
  });
});
