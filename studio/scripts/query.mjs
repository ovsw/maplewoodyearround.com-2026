#!/usr/bin/env node
// Run one GROQ query against the dataset and print the result as JSON.
// Reads drafts and published documents alike (the "raw" perspective), which
// the Sanity CLI's own `documents query` does not.
// Usage: pnpm sanity:query '<groq>' ['<json params>']
//   pnpm sanity:query '*[_type == "post" && title match "trampoline*"]{title, summary}'
//   pnpm sanity:query '*[_type == "page" && slug.current == $slug][0]{_id}' '{"slug":"about"}'

import process from "node:process";
import { getCliClient } from "sanity/cli";

const [query, rawParams] = process.argv.slice(2);
if (!query) {
  console.error("Usage: pnpm sanity:query '<groq>' ['<json params>']");
  process.exit(1);
}

const params = rawParams ? JSON.parse(rawParams) : {};
const client = getCliClient({ apiVersion: "2026-03-23" });
const result = await client.fetch(query, params, { perspective: "raw" });
console.log(JSON.stringify(result, null, 2));
