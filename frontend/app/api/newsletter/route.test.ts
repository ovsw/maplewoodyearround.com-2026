import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const send = (body: unknown, origin = "https://preview.example.test") =>
  POST(
    new Request("https://preview.example.test/api/newsletter", {
      method: "POST",
      headers: { origin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("newsletter submissions", () => {
  const upstream = vi.fn();
  beforeEach(() => {
    vi.stubEnv("FORMSPARK_FORM_ID", "test-form");
    vi.stubGlobal("fetch", upstream);
    upstream.mockResolvedValue(Response.json({}));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  it("sends only validated email to Formspark", async () => {
    expect(
      (
        await send({
          email: " reader@example.com ",
          _honeypot: "",
          arbitrary: "ignored",
        })
      ).status,
    ).toBe(200);
    expect(upstream).toHaveBeenCalledWith(
      "https://submit-form.com/test-form",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "reader@example.com", _honeypot: "" }),
      }),
    );
  });
  it("rejects cross-origin, malformed and oversized submissions without contacting Formspark", async () => {
    expect(
      (await send({ email: "reader@example.com" }, "https://other.example"))
        .status,
    ).toBe(403);
    expect((await send({ email: "not-an-email" })).status).toBe(400);
    expect((await send({ email: "x".repeat(5000) })).status).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("silently discards filled honeypots", async () => {
    expect(
      (await send({ email: "bot@example.com", _honeypot: "spam" })).status,
    ).toBe(200);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("does not claim success when Formspark rejects or cannot receive the submission", async () => {
    upstream.mockResolvedValueOnce(new Response(null, { status: 429 }));
    expect((await send({ email: "reader@example.com" })).status).toBe(502);
    upstream.mockRejectedValueOnce(new Error("network unavailable"));
    expect((await send({ email: "reader@example.com" })).status).toBe(502);
    vi.stubEnv("FORMSPARK_FORM_ID", "");
    expect((await send({ email: "reader@example.com" })).status).toBe(503);
    expect(upstream).toHaveBeenCalledTimes(2);
  });
});
