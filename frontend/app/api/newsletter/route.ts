import { z } from "zod";

const submission = z.object({
  email: z.string().trim().max(254).email(),
  _honeypot: z.string().max(500).nullish(),
});

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
  if (!formId || !/^[a-zA-Z0-9_-]+$/.test(formId)) {
    return Response.json({ error: "Newsletter unavailable" }, { status: 503 });
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
