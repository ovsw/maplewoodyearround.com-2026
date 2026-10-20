import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const siteverify = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const formspark = "https://submit-form.com/test-form";

const send = (
  body: Record<string, unknown>,
  origin = "https://preview.example.test",
) =>
  POST(
    new Request("https://preview.example.test/api/newsletter", {
      method: "POST",
      headers: {
        origin,
        "Content-Type": "application/json",
        "x-real-ip": "203.0.113.7",
      },
      body: JSON.stringify({ turnstileToken: "good-token", ...body }),
    }),
  );

describe("newsletter submissions", () => {
  const upstream = vi.fn();
  const turnstile = vi.fn<(body: URLSearchParams) => Promise<Response>>();
  const formsparkResponse = vi.fn<() => Promise<Response>>();
  const calls = (url: string) =>
    upstream.mock.calls.filter(([called]) => called === url);

  beforeEach(() => {
    vi.stubEnv("FORMSPARK_FORM_ID", "test-form");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    vi.stubGlobal("fetch", upstream);
    // Cloudflare passes only "good-token"; Formspark accepts everything.
    turnstile.mockImplementation(async (body) =>
      Response.json({ success: body.get("response") === "good-token" }),
    );
    formsparkResponse.mockImplementation(async () => Response.json({}));
    upstream.mockImplementation((url: string, init: RequestInit) =>
      url === siteverify
        ? turnstile(init.body as URLSearchParams)
        : formsparkResponse(),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  it("sends only validated email to Formspark after the bot check passes", async () => {
    expect(
      (
        await send({
          email: " reader@example.com ",
          _honeypot: "",
          arbitrary: "ignored",
        })
      ).status,
    ).toBe(200);
    const [[, check]] = calls(siteverify);
    const sent = check.body as URLSearchParams;
    expect(sent.get("secret")).toBe("test-secret");
    expect(sent.get("response")).toBe("good-token");
    expect(sent.get("remoteip")).toBe("203.0.113.7");
    expect(upstream).toHaveBeenLastCalledWith(
      formspark,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "reader@example.com", _honeypot: "" }),
      }),
    );
  });
  it("rejects cross-origin, malformed and oversized submissions without contacting anyone", async () => {
    expect(
      (await send({ email: "reader@example.com" }, "https://other.example"))
        .status,
    ).toBe(403);
    expect((await send({ email: "not-an-email" })).status).toBe(400);
    expect((await send({ email: "x".repeat(5000) })).status).toBe(413);
    expect(
      (await send({ email: "reader@example.com", turnstileToken: 42 })).status,
    ).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("silently discards filled honeypots", async () => {
    expect(
      (await send({ email: "bot@example.com", _honeypot: "spam" })).status,
    ).toBe(200);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("rejects a signup without a token or with a failed bot check", async () => {
    expect(
      (await send({ email: "bot@example.com", turnstileToken: undefined }))
        .status,
    ).toBe(403);
    expect(
      (await send({ email: "bot@example.com", turnstileToken: "" })).status,
    ).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
    expect(
      (await send({ email: "bot@example.com", turnstileToken: "bad-token" }))
        .status,
    ).toBe(403);
    expect(calls(siteverify)).toHaveLength(1);
    expect(calls(formspark)).toHaveLength(0);
  });
  it("does not send unchecked signups when Cloudflare cannot answer", async () => {
    turnstile.mockResolvedValueOnce(new Response(null, { status: 500 }));
    expect((await send({ email: "reader@example.com" })).status).toBe(502);
    turnstile.mockRejectedValueOnce(new Error("network unavailable"));
    expect((await send({ email: "reader@example.com" })).status).toBe(502);
    turnstile.mockResolvedValueOnce(new Response("not json"));
    expect((await send({ email: "reader@example.com" })).status).toBe(502);
    expect(calls(formspark)).toHaveLength(0);
  });
  it("is unavailable without the Formspark form or the Turnstile secret", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    expect((await send({ email: "reader@example.com" })).status).toBe(503);
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    vi.stubEnv("FORMSPARK_FORM_ID", "");
    expect((await send({ email: "reader@example.com" })).status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("does not claim success when Formspark rejects or cannot receive the submission", async () => {
    formsparkResponse.mockResolvedValueOnce(new Response(null, { status: 429 }));
    expect((await send({ email: "reader@example.com" })).status).toBe(502);
    formsparkResponse.mockRejectedValueOnce(new Error("network unavailable"));
    expect((await send({ email: "reader@example.com" })).status).toBe(502);
    expect(calls(formspark)).toHaveLength(2);
  });
});
