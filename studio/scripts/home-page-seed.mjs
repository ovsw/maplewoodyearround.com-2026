// Regenerate the review draft from the same source mapping used by the final import.
// HOME_SOURCE_SNAPSHOT is a private captured source file, never committed here.
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { buildPlan } from "./webflow/plan.mjs";
import { materialize } from "./webflow/write.mjs";

const snapshotPath = process.env.HOME_SOURCE_SNAPSHOT;
if (!snapshotPath)
  throw new Error(
    "Set HOME_SOURCE_SNAPSHOT to the private importer source snapshot",
  );
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const schema = JSON.parse(
  await readFile(new URL("../schema.json", import.meta.url), "utf8"),
);
const plan = buildPlan(snapshot, schema);
if (plan.gaps.length)
  throw new Error(
    "Resolve source coverage gaps before preparing the home draft",
  );
const manifest = JSON.parse(
  await readFile(
    path.join(homedir(), "backups/mdc/webflow-import/manifest.json"),
    "utf8",
  ),
);
const refs = new Map(
  plan.assets.flatMap((asset) => {
    const id = manifest.assets[asset.url]?.id;
    return id ? [[asset.token, id]] : [];
  }),
);
const home = plan.documents.find((document) => document._id === "homePage");
const [page] = materialize([home], refs);
if (JSON.stringify(page).includes("import-asset-"))
  throw new Error("Home media must already exist in Maplewood Sanity");
export default { page };
