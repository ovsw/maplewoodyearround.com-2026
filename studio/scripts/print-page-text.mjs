#!/usr/bin/env node
// Print a page as a reader would meet it: title, description, then every
// section's text in order. Reads the draft when one exists, else published.
// Usage: pnpm --dir studio page:text <slug> [--published]
//
// Use it to proofread a draft's copy in one pass (jargon, banned words,
// placeholders, sentences that sound like a machine wrote them).

import process from "node:process";
import { getCliClient } from "sanity/cli";
import { normalizeSlug, sectionText, SLUG_FILTER } from "./lib/page-text.mjs";

const args = process.argv.slice(2);
const publishedOnly = args.includes("--published");
const slug = normalizeSlug(args.find((argument) => !argument.startsWith("--")));
if (!slug) {
  console.error("Usage: pnpm --dir studio page:text <slug> [--published]");
  process.exit(1);
}

const client = getCliClient({ apiVersion: "2026-03-23" });

const pages = await client.fetch(
  `*[_type == "page" && ${SLUG_FILTER}]{
    _id, _updatedAt, title, description, "slug": slug.current, meta, blocks
  }`,
  { slug },
  { perspective: "raw" },
);

const draft = pages.find((page) => page._id.startsWith("drafts."));
const published = pages.find((page) => !page._id.startsWith("drafts."));
const page = publishedOnly ? published : (draft ?? published);

if (!page) {
  console.error(`No ${publishedOnly ? "published " : ""}page with slug "${slug}".`);
  process.exit(2);
}

const state = page._id.startsWith("drafts.") ? "draft" : "published";
console.log(`# ${page.title}  (/${page.slug})`);
console.log(`Document: ${page._id} (${state}, updated ${page._updatedAt})`);
if (published && draft && !publishedOnly) {
  console.log(`Published copy also exists: ${published._id}`);
}
if (page.description) console.log(`Description: ${page.description}`);
if (page.meta?.title) console.log(`SEO title: ${page.meta.title}`);
if (page.meta?.description) console.log(`SEO description: ${page.meta.description}`);

const blocks = page.blocks ?? [];
console.log(`Sections: ${blocks.length ? blocks.map((block) => block._type).join(", ") : "none"}`);

blocks.forEach((block, index) => {
  console.log(`\n## ${index + 1}. [${block._type}] ${block._key ?? "(no key)"}\n${sectionText(block)}`);
});
