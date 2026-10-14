import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

// The Sanity Function in studio/functions/invalidate-tags calls this on every
// publish, with the sync tags of the content that changed. Sanity knows which
// cached reads used that content, so only the pages that show it are expired,
// whether or not a visitor has them open. The next visit reads them fresh.
export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return Response.json(
      { error: "Missing SANITY_REVALIDATE_SECRET" },
      { status: 500 },
    );
  }

  if (!isAuthorized(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const tags = (body as { tags?: unknown } | null)?.tags;
  if (
    !Array.isArray(tags) ||
    tags.length === 0 ||
    !tags.every((tag) => typeof tag === "string")
  ) {
    return Response.json(
      { error: "`tags` must be a non-empty array of strings" },
      { status: 400 },
    );
  }

  for (const tag of tags) {
    // sanityFetch from defineLive tags its reads "sanity:<sync tag>".
    revalidateTag(`sanity:${tag}`, { expire: 0 });
  }

  return Response.json({ revalidated: tags.length });
}

function isAuthorized(header: string | null, secret: string) {
  const given = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
