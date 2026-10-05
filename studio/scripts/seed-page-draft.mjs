#!/usr/bin/env node
// Write a page draft, and the draft documents it depends on, from a seed
// module. Drafts only: nothing here publishes.
//
// Usage:
//   pnpm --dir studio page:seed <seed.mjs>            # dry run: prints the plan
//   pnpm --dir studio page:seed <seed.mjs> --apply    # writes the drafts
//
// The seed module default-exports:
//   {
//     page: {
//       _id: "aboutPage",   // published id, without "drafts."
//       slug: "about", // only needed when the page is new
//       title, description, meta,                // optional, set when given
//       blocks: [ ...sections with _key and _type ],
//     },
//     documents: [ { _id: "faq-about-1", _type: "faq", ... }, ... ],  // optional
//   }
//
// Behaviour:
// - the page draft is created from the published document when no draft
//   exists, or from scratch for a new page (slug and title required);
// - fields named in the seed replace the draft's fields; `blocks` replaces the
//   whole section list; fields not named are kept;
// - a draft that changed since it was read is not overwritten (revision guard);
// - supporting documents are written as drafts with createOrReplace, so give
//   them ids scoped to the page (e.g. "faq-about-hours");
// - array items missing a `_key` get a deterministic one.

import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getCliClient } from "sanity/cli";
import { assertMdcProductionTarget } from "./assert-mdc-production-target.mjs";

const API_VERSION = "2026-03-23";

function usage(message) {
  if (message) console.error(message);
  console.error("Usage: pnpm --dir studio page:seed <seed.mjs> [--apply]");
  process.exit(1);
}

function keyFor(pathParts) {
  return createHash("sha1").update(pathParts.join(".")).digest("base64url").slice(0, 12);
}

/** Give every object inside an array a `_key` when it lacks one. */
export function withKeys(value, pathParts = []) {
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      const itemPath = [...pathParts, String(index)];
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const keyed =
          typeof item._key === "string" && item._key
            ? item
            : { ...item, _key: keyFor(itemPath) };
        return withKeys(keyed, [...pathParts, keyed._key]);
      }
      return withKeys(item, itemPath);
    });
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, withKeys(item, [...pathParts, key])]),
    );
  }
  return value;
}

function summarizeBlocks(blocks = []) {
  return blocks.map((block, index) => `${index + 1}. ${block._type} (${block._key})`);
}

async function loadSeed(file) {
  // pnpm runs this from studio/; resolve the seed from where pnpm was invoked.
  const baseDirectory = process.env.INIT_CWD ?? process.cwd();
  const module = await import(pathToFileURL(path.resolve(baseDirectory, file)).href);
  const seed = module.default;
  if (!seed?.page?._id) usage("The seed must default-export { page: { _id, ... } }.");
  if (seed.page._id.startsWith("drafts.")) usage("Give the page's published id, without the drafts. prefix.");
  // The Parent dashboard has card lists instead of sections.
  if (seed.page._id !== "parentDashboard" && !Array.isArray(seed.page.blocks)) {
    usage("page.blocks must be an array of sections.");
  }
  for (const block of seed.page.blocks ?? []) {
    if (!block?._type) usage("Every section needs a _type.");
  }
  for (const document of seed.documents ?? []) {
    if (!document?._id || !document?._type) usage("Every supporting document needs _id and _type.");
    if (document._id.startsWith("drafts.")) usage(`Give ${document._id} without the drafts. prefix.`);
  }
  return seed;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const file = args.find((argument) => !argument.startsWith("--"));
  if (!file) usage();

  const seed = await loadSeed(file);
  const client = getCliClient({ apiVersion: API_VERSION });
  const { dataset, projectId } = client.config();
  assertMdcProductionTarget({ dataset, projectId });

  const { _id: pageId, slug, ...pageFields } = seed.page;
  const draftId = `drafts.${pageId}`;
  const [published, draft] = await Promise.all([
    client.fetch(`*[_id == $id][0]`, { id: pageId }, { perspective: "raw" }),
    client.fetch(`*[_id == $id][0]`, { id: draftId }, { perspective: "raw" }),
  ]);

  const base = draft ?? published;
  const pageType = base?._type ?? pageFields._type ?? "page";
  if (!["page", "homePage", "blogIndex", "parentDashboard"].includes(pageType) ||
      (pageFields._type && pageFields._type !== pageType)) {
    usage("A seed must preserve the existing page document type.");
  }
  if (!base && !(slug && pageFields.title)) {
    usage(`Page ${pageId} does not exist; a new page needs slug and title in the seed.`);
  }
  const pageDocument = withKeys({
    ...(base ?? { _type: "page", slug: { _type: "slug", current: slug } }),
    ...pageFields,
    _id: draftId,
    _type: pageType,
  });
  delete pageDocument._rev;
  delete pageDocument._createdAt;
  delete pageDocument._updatedAt;
  delete pageDocument._system;

  const documents = (seed.documents ?? []).map((document) =>
    withKeys({ ...document, _id: `drafts.${document._id}` }),
  );

  const plan = {
    mode: apply ? "apply" : "dry-run",
    projectId,
    dataset,
    page: {
      id: draftId,
      from: draft ? "existing draft" : published ? "published copy" : "new page",
      slug: pageDocument.slug?.current,
      title: pageDocument.title,
      fieldsSet: Object.keys(pageFields),
      sections: summarizeBlocks(pageDocument.blocks),
    },
    documents: documents.map((document) => `${document._id} (${document._type})`),
  };
  console.log(JSON.stringify(plan, null, 2));
  if (!apply) {
    console.log("Dry run. Add --apply to write these drafts.");
    return;
  }

  const transaction = client.transaction();
  if (draft) {
    const { _id, _type, ...fields } = pageDocument;
    transaction.patch(draftId, (patch) => patch.ifRevisionId(draft._rev).set(fields));
  } else {
    transaction.create(pageDocument);
  }
  for (const document of documents) transaction.createOrReplace(document);

  try {
    await transaction.commit({ visibility: "async" });
  } catch (error) {
    if (`${error.message}`.includes("revision")) {
      console.error(
        `The draft ${draftId} changed while this seed ran (another session?). Re-read it and run again.`,
      );
      process.exit(3);
    }
    throw error;
  }
  console.log(`Wrote ${draftId}${documents.length ? ` and ${documents.length} supporting draft(s)` : ""}.`);
  console.log("Nothing was published.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });
}
