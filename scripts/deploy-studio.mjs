import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isIP } from "node:net";
import path from "node:path";
import { parseEnv } from "node:util";

const studioDirectory = path.resolve(import.meta.dirname, "../studio");

try {
  if (process.argv.length > 2) {
    throw new Error("Studio deployment does not accept extra arguments. Run pnpm deploy:studio.");
  }

  const local = parseEnv(readFileSync(path.join(studioDirectory, ".env.local"), "utf8"));
  const production = parseEnv(readFileSync(path.join(studioDirectory, ".env.production"), "utf8"));
  const previewUrl = production.SANITY_STUDIO_PREVIEW_URL?.trim();
  const appId = production.SANITY_STUDIO_APP_ID?.trim();
  const token = local.SANITY_DEPLOY_TOKEN?.trim();

  if (!previewUrl || !appId) {
    throw new Error("Set SANITY_STUDIO_PREVIEW_URL and SANITY_STUDIO_APP_ID in studio/.env.production.");
  }
  if (!token) {
    throw new Error("Set SANITY_DEPLOY_TOKEN in studio/.env.local before deploying Studio.");
  }
  // Sanity also reads .env.local through Vite. Merely omitting it from the
  // child environment does not keep local-only public variables out of builds.
  const localOnlyPublicNames = Object.keys(local).filter((name) =>
    /^(SANITY_STUDIO_|SANITY_APP_)/.test(name) && !Object.hasOwn(production, name),
  );
  if (localOnlyPublicNames.length) {
    throw new Error(`Set explicit production values for local public settings before deploying: ${localOnlyPublicNames.join(", ")}`);
  }

  const url = new URL(previewUrl);
  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (
    url.protocol !== "https:" ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    !hostname.includes(".") ||
    isIP(hostname) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("The production preview URL must be an HTTPS website origin, without localhost, an IP address, credentials, or a page path.");
  }

  console.log(`Deploying Studio ${appId} with preview ${url.origin}`);
  const result = spawnSync("pnpm", ["exec", "sanity", "deploy"], {
    cwd: studioDirectory,
    stdio: "inherit",
    env: {
      ...process.env,
      ...production,
      SANITY_AUTH_TOKEN: token,
      SANITY_STUDIO_PREVIEW_URL: url.origin,
      SANITY_STUDIO_APP_ID: appId,
      SANITY_ACTIVE_ENV: "production",
      NODE_ENV: "production",
    },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
