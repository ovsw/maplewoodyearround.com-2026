import type { ValidationContext } from "sanity";

import {
  isApplicationPath,
  normalizePublicPath,
} from "../../../shared/content-routes.ts";
import { getPresentationPath } from "../../presentation/routes.ts";

export type RedirectRecord = {
  _id?: string;
  _rev?: string;
  destination?: { current?: string } | string;
  destinationReference?: { _ref?: string; _type?: "reference" };
  permanent?: "false" | "true" | boolean;
  source?: { current?: string } | string;
  status?: string;
};

type LiveRoute = {
  _id: string;
  path?: string;
  type?: string;
};

type RedirectValidationData = {
  liveRoutes: LiveRoute[];
  redirects: RedirectRecord[];
};

const LIVE_SYSTEM_PATHS = new Set(["/", "/blog"]);
const MISSING_DESTINATION_ERROR =
  "Can't redirect to a non-existent or non-published page. " +
  "No published page with this slug exists. Please create one.";

export function normalizeRedirectPath(value?: string | null) {
  return normalizePublicPath(value);
}

export function toStoredRedirectPath(value?: string | null) {
  return normalizeRedirectPath(value);
}

export function readRedirectPath(value: RedirectRecord["source"]) {
  return typeof value === "string" ? value : value?.current;
}

function publishedDocumentId(documentId?: string) {
  return documentId
    ?.replace(/^drafts\./, "")
    .replace(/^versions\.[^.]+\./, "");
}

function resolveDestinationPath(
  redirect: RedirectRecord,
  liveRoutes: LiveRoute[],
) {
  const destinationId = publishedDocumentId(
    redirect.destinationReference?._ref,
  );
  if (destinationId) {
    return liveRoutes.find(
      (route) => publishedDocumentId(route._id) === destinationId,
    )?.path;
  }

  return readRedirectPath(redirect.destination);
}

function active(record: RedirectRecord) {
  return !record.status || record.status === "active";
}

export function topologyError(redirects: RedirectRecord[]) {
  const redirectsBySource = new Map<string, string>();

  for (const redirect of redirects.filter(active)) {
    const source = normalizeRedirectPath(readRedirectPath(redirect.source));
    const destination = normalizeRedirectPath(
      readRedirectPath(redirect.destination),
    );
    if (!source || !destination) continue;
    if (source === destination) return `Self redirect at ${source}`;

    const existingDestination = redirectsBySource.get(source);
    if (existingDestination && existingDestination !== destination) {
      return `Conflicting redirect source ${source}`;
    }
    redirectsBySource.set(source, destination);
  }

  for (const [source, destination] of redirectsBySource) {
    if (redirectsBySource.has(destination)) {
      return `Redirect chain or cycle at ${source}`;
    }
  }

  return undefined;
}

export function getRedirectValidationIssues({
  current,
  liveRoutes,
  redirects,
}: {
  current: RedirectRecord;
  liveRoutes: LiveRoute[];
  redirects: RedirectRecord[];
}) {
  const sourceValue = readRedirectPath(current.source);
  const destinationValue = readRedirectPath(current.destination);
  const source = normalizeRedirectPath(sourceValue);
  const destination = normalizeRedirectPath(destinationValue);
  const errors: { destination?: string; source?: string } = {};

  if (sourceValue && (!sourceValue.trim().startsWith("/") || !source)) {
    errors.source = "The source must be an internal path that starts with /";
  }
  if (
    destinationValue &&
    (!destinationValue.trim().startsWith("/") || !destination)
  ) {
    errors.destination =
      "The destination must be an internal path that starts with /";
  }
  if (source && destination && source === destination) {
    errors.destination = "Source and destination cannot be the same route";
  }

  if (
    source &&
    isApplicationPath(source)
  ) {
    errors.source = "This source is reserved by an existing site route";
  }

  const livePath = liveRoutes.find(
    (route) => normalizeRedirectPath(route.path) === source,
  );
  if (source && livePath) {
    errors.source = `This source is already used by a ${livePath.type ?? "published document"}`;
  }

  if (active(current)) {
    const activeRedirects = redirects.filter(active);
    const duplicateSource = redirects.find(
      (redirect) =>
        normalizeRedirectPath(readRedirectPath(redirect.source)) === source,
    );
    if (source && duplicateSource) {
      errors.source = "Another redirect already uses this source";
    }

    const sourcesPointingHere = activeRedirects.filter(
      (redirect) =>
        normalizeRedirectPath(readRedirectPath(redirect.destination)) === source,
    );
    if (source && sourcesPointingHere.length > 0) {
      const incomingSources = Array.from(
        new Set(
          sourcesPointingHere.flatMap((redirect) => {
            const incomingSource = toStoredRedirectPath(
              readRedirectPath(redirect.source),
            );
            return incomingSource ? [incomingSource] : [];
          }),
        ),
      );

      if (incomingSources.length === 1) {
        errors.source =
          `The active redirect from ${incomingSources[0]} points here. ` +
          "Update or deactivate it before using this path as a source";
      } else if (incomingSources.length > 1) {
        errors.source =
          `${incomingSources.length} active redirects point here: ${incomingSources.join(", ")}. ` +
          "Update or deactivate them before using this path as a source";
      }
    }

    const destinationIsSource = activeRedirects.find(
      (redirect) =>
        normalizeRedirectPath(readRedirectPath(redirect.source)) === destination,
    );
    if (destination && destinationIsSource) {
      errors.destination = "This destination redirects again and would create a chain";
    }
  }

  const destinationExists =
    destination &&
    (LIVE_SYSTEM_PATHS.has(destination) ||
      liveRoutes.some(
        (route) => normalizeRedirectPath(route.path) === destination,
      ));
  if (destination && !destinationExists && !errors.destination) {
    errors.destination = MISSING_DESTINATION_ERROR;
  }

  return { errors };
}

function documentIds(documentId?: string) {
  const publishedId = documentId?.replace(/^drafts\./, "") ?? "";
  return [publishedId, `drafts.${publishedId}`];
}

// The two validators below run together on every validation pass and each
// needs the same dataset-wide snapshot. Share one in-flight request between
// them, keyed by the document revision so an edit still refetches.
let validationDataCache:
  | { key: string; promise: Promise<RedirectValidationData> }
  | undefined;

function fetchValidationData(context: ValidationContext) {
  const key = `${context.document?._id ?? ""}:${context.document?._rev ?? ""}`;
  if (validationDataCache?.key === key) return validationDataCache.promise;

  const promise = requestValidationData(context).catch((error: unknown) => {
    if (validationDataCache?.key === key) validationDataCache = undefined;
    throw error;
  });
  validationDataCache = { key, promise };
  return promise;
}

async function requestValidationData(context: ValidationContext) {
  const client = context.getClient({ apiVersion: "2026-03-23" });
  const data = (await client.fetch(
    `{
      "redirects": *[
        _type == "redirect" &&
        !(_id in $currentIds)
      ]{
        _id,
        status,
        source,
        destination,
        destinationReference,
        permanent
      },
      "liveRoutes": *[
        _type in ["page", "post", "category", "homePage", "blogIndex"] &&
        !(_id in path("drafts.**")) &&
        !(_id in path("versions.**")) &&
        (_type in ["homePage", "blogIndex"] || defined(slug.current))
      ]{
        _id,
        _type,
        "slug": slug.current
      }
    }`,
    { currentIds: documentIds(context.document?._id) },
  )) as {
    liveRoutes: Array<{ _id: string; _type: string; slug?: string }>;
    redirects: RedirectRecord[];
  };

  const liveRoutes = data.liveRoutes.map((route) => ({
    _id: route._id,
    path: getPresentationPath(route._type, route.slug) ?? undefined,
    type: route._type,
  }));

  return {
    redirects: data.redirects.map((redirect) => ({
      ...redirect,
      destination: resolveDestinationPath(redirect, liveRoutes),
    })),
    liveRoutes,
  } satisfies RedirectValidationData;
}

function currentRedirect(
  context: ValidationContext,
  liveRoutes: LiveRoute[],
): RedirectRecord {
  const current = (context.document ?? {}) as RedirectRecord;
  return {
    ...current,
    destination: resolveDestinationPath(current, liveRoutes),
  };
}

export async function validateRedirectSource(
  value: unknown,
  context: ValidationContext,
) {
  const data = await fetchValidationData(context);
  return (
    getRedirectValidationIssues({
      // The field value is newer than context.document while Studio is saving.
      current: {
        ...currentRedirect(context, data.liveRoutes),
        source: value as RedirectRecord["source"],
      },
      ...data,
    }).errors.source ?? true
  );
}

export async function validateRedirectDestinationReference(
  value: unknown,
  context: ValidationContext,
) {
  const data = await fetchValidationData(context);
  const current = {
    ...((context.document ?? {}) as RedirectRecord),
    destinationReference: value as RedirectRecord["destinationReference"],
  };
  const destination = resolveDestinationPath(current, data.liveRoutes);
  if (value && !destination) return MISSING_DESTINATION_ERROR;

  return (
    getRedirectValidationIssues({
      current: {
        ...current,
        destination,
      },
      ...data,
    }).errors.destination ?? true
  );
}
