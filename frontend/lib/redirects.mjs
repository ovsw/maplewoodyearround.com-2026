import {
  isApplicationPath,
  normalizePublicPath,
} from "../../shared/content-routes.ts";

function normalizePath(value) {
  return typeof value === "string" ? normalizePublicPath(value) : "";
}

function readSlug(value) {
  return typeof value === "string" ? value : value?.current;
}

function getStatusCode(permanent) {
  return permanent === false || permanent === "false" ? 302 : 301;
}

/**
 * Convert active Sanity redirect records into explicit Next.js redirect rules.
 * Conflicting sources, chains, cycles, and self-redirects fail the build.
 */
export function compileNextRedirects(records) {
  const redirectsBySource = new Map();

  for (const record of records) {
    if (record.status && record.status !== "active") continue;

    const source = normalizePath(readSlug(record.source));
    const destination = normalizePath(readSlug(record.destination));
    if (!source || !destination) {
      throw new Error("Active redirect is missing a valid internal source or destination");
    }
    if (isApplicationPath(source)) {
      throw new Error(`Redirect source is reserved by the application: ${source}`);
    }
    if (source === normalizePath(destination)) {
      throw new Error(`Redirect source and destination are the same: ${source}`);
    }

    const statusCode = getStatusCode(record.permanent);
    const existing = redirectsBySource.get(source);
    if (existing) {
      if (
        normalizePath(existing.destination) !== normalizePath(destination) ||
        existing.statusCode !== statusCode
      ) {
        throw new Error(`Conflicting redirects share the source ${source}`);
      }
      continue;
    }

    redirectsBySource.set(source, { destination, statusCode });
  }

  for (const [source, redirect] of redirectsBySource) {
    const destination = normalizePath(redirect.destination);
    if (redirectsBySource.has(destination)) {
      throw new Error(`Redirect chain or cycle detected: ${source} -> ${destination}`);
    }
  }

  return [...redirectsBySource].map(([source, redirect]) => ({
    source,
    destination: redirect.destination,
    statusCode: redirect.statusCode,
  }));
}
