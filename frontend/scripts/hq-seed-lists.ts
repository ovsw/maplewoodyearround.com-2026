// One-time: reads the Website's published Camp groups and Summer activities
// (names and grades) and writes Camp HQ's seed file. Read-only towards the
// Website. After the first run Admins edit the lists in Camp HQ, so this is
// only run again to rebuild the seed before Camp HQ has real data.
//
//   pnpm --dir frontend hq:seed-lists
//
// Needs NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET (from the
// environment or frontend/.env.local). The published dataset is public, so no
// token is used.
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { buildCampHqSeed, type WebsiteListItem } from "../lib/hq/db/seed-lists.ts";

const QUERY = `{
  "campGroups": *[_type == "campGroup"] | order(title) { "name": title, "grades": coalesce(grades[]->title, []) },
  "activities": *[_type == "summerActivity"] | order(title) { "name": title, "grades": coalesce(grades[]->title, []) }
}`;

type QueryResult = { campGroups: WebsiteListItem[]; activities: WebsiteListItem[] };

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) {
    throw new Error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET.");
  }
  const apiVersion = (process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-03-23").replace(/^v/, "");
  const url = new URL(`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set("query", QUERY);
  url.searchParams.set("perspective", "published");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sanity answered ${response.status}: ${await response.text()}`);
  const { result } = (await response.json()) as { result: QueryResult };

  const readOn = new Date().toISOString().slice(0, 10);
  const seed = buildCampHqSeed(result, {
    source: `Website (Sanity dataset "${dataset}", published), read on ${readOn}`,
  });
  const file = path.join(process.cwd(), "lib", "hq", "db", "seed-lists.json");
  await writeFile(file, `${JSON.stringify(seed, null, 2)}\n`);
  console.log(
    `Wrote ${seed.campGroups.length} Camp groups and ${seed.activities.length} activities to ${file}.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
