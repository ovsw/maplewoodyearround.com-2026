/**
 * This configuration file lets you run `$ sanity [command]` in this folder
 * Go to https://www.sanity.io/docs/cli to learn more.
 **/
import { defineCliConfig } from "sanity/cli";
import { requireStudioEnvironmentValue } from "./environment";

const projectId = requireStudioEnvironmentValue(
  "SANITY_STUDIO_PROJECT_ID",
  process.env.SANITY_STUDIO_PROJECT_ID,
);
const dataset = requireStudioEnvironmentValue(
  "SANITY_STUDIO_DATASET",
  process.env.SANITY_STUDIO_DATASET,
);
const appId = process.env.SANITY_STUDIO_APP_ID;

export default defineCliConfig({
  api: { projectId, dataset },
  typegen: {
    path: "../frontend/sanity/queries/*.{ts,tsx,js,jsx}",
    schema: "schema.json",
    generates: "../frontend/sanity.types.ts",
    overloadClientMethods: true,
  },
  deployment: {
    appId,
  },
});
