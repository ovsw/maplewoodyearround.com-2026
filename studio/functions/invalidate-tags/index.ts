import { syncTagInvalidateEventHandler } from "@sanity/functions";

// Runs in Sanity after each publish, when the change can be queried. It sends
// the sync tags of the changed content to the Website, which expires the
// cached pages that used it. Then it calls done(), which releases the change
// to pages open in a browser (<SanityLive waitFor="function" />).
//
// Function environment variables (`sanity functions env add`):
// REVALIDATE_TAGS_URL, the Website's /api/revalidate-tags address, and
// SANITY_REVALIDATE_SECRET, the same secret the Website has.

// Two tries of at most 4 seconds each. The blueprint gives the function 20
// seconds, so a slow Website never stops it before done().
const TRIES = 2;
const TRY_TIMEOUT_MS = 4_000;

export const handler = syncTagInvalidateEventHandler(
  async ({ event, done }) => {
    const { syncTags } = event.data;

    await expireOnWebsite(syncTags);

    // Always release the change, as Sanity requires. Sanity does not run the
    // function again, so holding done() back after a failure would only stop
    // open pages from refreshing.
    try {
      const response = await done(syncTags);
      console.log("Released the change to open pages: HTTP", response.status);
    } catch (error) {
      console.error("Sanity did not accept done()", error);
    }
  },
);

async function expireOnWebsite(syncTags: string[]) {
  const url = process.env.REVALIDATE_TAGS_URL;
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!url || !secret) {
    console.error("Missing REVALIDATE_TAGS_URL or SANITY_REVALIDATE_SECRET");
    return;
  }

  for (let attempt = 1; attempt <= TRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ tags: syncTags }),
        signal: AbortSignal.timeout(TRY_TIMEOUT_MS),
      });
      if (response.ok) {
        console.log(`The Website expired ${syncTags.length} sync tags`);
        return;
      }
      console.error(
        `Try ${attempt}: the Website answered HTTP ${response.status}`,
      );
    } catch (error) {
      console.error(`Try ${attempt}: the Website did not answer`, error);
    }
  }
  console.error(
    "The Website did not expire the sync tags. The pages that use them stay old until the next publish or deploy.",
  );
}
