import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/sanity/lib/client", () => ({ client: { fetch: vi.fn() } }));

// A well-formed development key for an invented Clerk instance. Signed-out
// requests are decided without calling Clerk.
const fakePublishableKey = `pk_test_${Buffer.from(
  "camp-hq-test.clerk.accounts.dev$",
).toString("base64")}`;

async function requestCampHq(path: string) {
  const { proxy } = await import("@/proxy");
  return proxy(new NextRequest(`https://www.example.com${path}`));
}

describe("Camp HQ route protection", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("with Clerk keys", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", fakePublishableKey);
      vi.stubEnv("CLERK_SECRET_KEY", "sk_test_camp_hq_invented_secret");
    });

    test.each(["/hq", "/hq/", "/hq/rosters/today"])(
      "sends a signed-out visitor from %s to the sign-in page",
      async (path) => {
        const response = await requestCampHq(path);

        expect(response.status).toBe(307);
        const location = new URL(response.headers.get("location")!);
        expect(location.pathname).toBe("/hq/sign-in");
        expect(location.searchParams.get("redirect_url")).toBe(
          `https://www.example.com${path}`,
        );
        expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      },
    );

    test("lets a signed-out visitor open the sign-in page", async () => {
      const response = await requestCampHq("/hq/sign-in");

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    });

    test("has no sign-up route to let anyone in", async () => {
      const response = await requestCampHq("/hq/sign-up");

      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/hq/sign-in",
      );
    });
  });

  test("without Clerk keys, passes /hq through to the not-available page", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");

    const response = await requestCampHq("/hq");

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  test("leaves Website paths that only start with hq alone", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", fakePublishableKey);
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_camp_hq_invented_secret");

    const response = await requestCampHq("/hqx");

    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toBeNull();
  });
});
