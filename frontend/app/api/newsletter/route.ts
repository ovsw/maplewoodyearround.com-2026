import { z } from "zod";

const submission = z.object({
  email: z.string().trim().max(254).email(),
  _honeypot: z.string().max(500).nullish(),
  // Cloudflare tokens are at most 2048 characters.
  turnstileToken: z.string().max(2048).nullish(),
});

// Cloudflare checks the token that the browser's Turnstile widget produced.
// Each token passes this check once only.
async function passesTurnstile(token: string, secret: string, ip?: string) {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body, signal: AbortSignal.timeout(10_000) },
  );
  if (!response.ok) throw new Error(`Turnstile answered ${response.status}`);
  const result: unknown = await response.json();
  return (
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    result.success === true
  );
}

export async function POST(request: Request) {
  // This endpoint accepts browser submissions from this Website only.
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Invalid content type" }, { status: 415 });
  }
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json({ error: "Invalid submission" }, { status: 400 });
  let bytes = 0;
  let body = "";
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4096) {
        await reader.cancel();
        return Response.json(
          { error: "Submission too large" },
          { status: 413 },
        );
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } catch {
    return Response.json({ error: "Invalid submission" }, { status: 400 });
  } finally {
    reader.releaseLock();
  }
  let fields;
  try {
    fields = submission.safeParse(JSON.parse(body));
  } catch {
    return Response.json({ error: "Invalid submission" }, { status: 400 });
  }
  if (!fields.success)
    return Response.json({ error: "Invalid email" }, { status: 400 });
  if (fields.data._honeypot) return Response.json({ ok: true });

  const formId = process.env.FORMSPARK_FORM_ID;
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (!formId || !/^[a-zA-Z0-9_-]+$/.test(formId) || !turnstileSecret) {
    return Response.json({ error: "Newsletter unavailable" }, { status: 503 });
  }
  // Only a signup that passes the bot check reaches Formspark.
  if (!fields.data.turnstileToken)
    return Response.json({ error: "Bot check failed" }, { status: 403 });
  try {
    const passed = await passesTurnstile(
      fields.data.turnstileToken,
      turnstileSecret,
      request.headers.get("x-real-ip") ?? undefined,
    );
    if (!passed)
      return Response.json({ error: "Bot check failed" }, { status: 403 });
  } catch {
    return Response.json({ error: "Bot check unavailable" }, { status: 502 });
  }
  try {
    const response = await fetch(`https://submit-form.com/${formId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email: fields.data.email, _honeypot: "" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok)
      return Response.json({ error: "Submission failed" }, { status: 502 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Submission failed" }, { status: 502 });
  }
}
