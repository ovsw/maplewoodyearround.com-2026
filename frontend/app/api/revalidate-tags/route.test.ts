import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag }));

const { POST } = await import("./route");

const SECRET = "function-secret";

function call(
  body: unknown,
  authorization: string | null = `Bearer ${SECRET}`,
) {
  return POST(
    new Request("https://example.test/api/revalidate-tags", {
      method: "POST",
      headers: authorization ? { authorization } : {},
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("revalidate-tags route", () => {
  beforeEach(() => {
    revalidateTag.mockReset();
    vi.stubEnv("SANITY_REVALIDATE_SECRET", SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("expires each sync tag that the function sends, at once", async () => {
    const response = await call({ tags: ["s1:abc", "s1:def"] });

    expect(response.status).toBe(200);
    expect(revalidateTag.mock.calls).toEqual([
      ["sanity:s1:abc", { expire: 0 }],
      ["sanity:s1:def", { expire: 0 }],
    ]);
  });

  it("refuses a call with another secret", async () => {
    const response = await call({ tags: ["s1:abc"] }, "Bearer another-secret");

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("refuses a call without a secret", async () => {
    const response = await call({ tags: ["s1:abc"] }, null);

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("refuses every call when the Website has no secret", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "");

    const response = await call({ tags: ["s1:abc"] });

    expect(response.status).toBe(500);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it.each([["not json"], [{}], [{ tags: [] }], [{ tags: ["s1:abc", 2] }]])(
    "rejects a body without a list of tags: %j",
    async (body) => {
      const response = await call(body);

      expect(response.status).toBe(400);
      expect(revalidateTag).not.toHaveBeenCalled();
    },
  );
});
