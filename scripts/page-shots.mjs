#!/usr/bin/env node
// Screenshot every Page Builder section of one page draft, at desktop and
// phone widths, through the frontend's draft mode.
//
//   pnpm page:shots <slug> [--out <dir>] [--only desktop|phone]
//
// Reads SANITY_AUTH_TOKEN from the environment (the root script loads
// studio/.env.local), the dev ports from .worktree-ports.json, and writes
// <out>/<viewport>/<nn>-<sectionKey>.png. Prints one JSON line per viewport
// with the page height and every section's height. It stops when the rendered
// sections do not match the draft's blocks, so a published-only render is never
// mistaken for the draft.

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const slug = (args.find((a) => !a.startsWith("--")) ?? "").replace(/^\/+/, "");
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
if (!slug) {
  console.error("Usage: pnpm page:shots <slug> [--out <dir>] [--only desktop|phone]");
  process.exit(1);
}
// The default folder name comes from the slug, so keep it to one safe path segment.
const safeSlug = slug.replace(/[^a-zA-Z0-9-]+/g, "_").replace(/^_+|_+$/g, "") || "page";
const outRoot = path.resolve(flag("--out") ?? `/tmp/maplewood-page-shots/${safeSlug}`);
const only = flag("--only");
const token = process.env.SANITY_AUTH_TOKEN;
if (!token) {
  console.error("SANITY_AUTH_TOKEN is missing. Run through `pnpm page:shots` so studio/.env.local is loaded.");
  process.exit(1);
}

const portsFile = path.join(root, ".worktree-ports.json");
const ports = existsSync(portsFile)
  ? JSON.parse(readFileSync(portsFile, "utf8"))
  : { frontendPort: 3000, studioPort: 3333 };
const frontend = `http://127.0.0.1:${ports.frontendPort}`;
const studio = `http://127.0.0.1:${ports.studioPort}`;

// Resolve packages the way the frontend does, so pnpm's strict layout works.
const frontendRequire = createRequire(path.join(root, "frontend", "package.json"));
const nextSanityRequire = createRequire(frontendRequire.resolve("next-sanity/package.json"));
const playwrightRequire = createRequire(frontendRequire.resolve("@playwright/test/package.json"));
const { createClient } = await import(pathToFileURL(frontendRequire.resolve("@sanity/client")));
const { createPreviewSecret } = await import(
  pathToFileURL(nextSanityRequire.resolve("@sanity/preview-url-secret/create-secret"))
);
const playwright = await import(pathToFileURL(playwrightRequire.resolve("playwright")));
const chromium = playwright.chromium ?? playwright.default.chromium;

const env = readFileSync(path.join(root, "studio", ".env.local"), "utf8");
const envValue = (key) => env.match(new RegExp(`^${key}=["']?([^"'\\n]+)`, "m"))?.[1];
const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? envValue("SANITY_STUDIO_PROJECT_ID");
const dataset = process.env.SANITY_STUDIO_DATASET ?? envValue("SANITY_STUDIO_DATASET");
if (!projectId || !dataset) {
  console.error("Could not read SANITY_STUDIO_PROJECT_ID / SANITY_STUDIO_DATASET from studio/.env.local.");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false });

// The draft's own section keys are the proof that the browser shows the draft:
// the rendered wrappers must carry exactly these keys, in this order.
const pageDoc = await client
  .withConfig({ perspective: "raw" })
  .fetch(
    `*[_type=="page" && slug.current==$slug] | order(select(_id in path("drafts.**") => 0, 1))[0]{_id, "keys": blocks[]._key}`,
    { slug },
  );
if (!pageDoc) {
  console.error(`No page document has the slug "${slug}".`);
  process.exit(1);
}
const expectedKeys = pageDoc.keys ?? [];
if (expectedKeys.length === 0) {
  console.error(`${pageDoc._id} has no Page Builder sections to screenshot.`);
  process.exit(1);
}

const { secret } = await createPreviewSecret(client, "page-shots", studio);
const enableUrl =
  `${frontend}/api/draft-mode/enable?sanity-preview-secret=${encodeURIComponent(secret)}` +
  `&sanity-preview-pathname=${encodeURIComponent(`/${slug}`)}`;

const viewports = {
  desktop: { width: 1440, height: 1000 },
  phone: { width: 390, height: 844 },
};

async function shoot(name, viewport) {
  const out = path.join(outRoot, name);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport })).newPage();
  try {
    await page.goto(enableUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForSelector("h1", { timeout: 90_000 });
    // Reveal animations use animation-timeline: view(); pausing them leaves
    // sections at opacity 0, so remove them instead.
    await page.addStyleTag({
      content:
        "*{animation:none!important;transition:none!important;opacity:1!important}" +
        "sanity-visual-editing,nextjs-portal,a[href='#main-content']{display:none!important}",
    });
    await page.evaluate(() => {
      document.querySelector("header")?.style.setProperty("display", "none");
      for (const el of document.querySelectorAll("a,button")) {
        if (/Disable Draft Mode/i.test(el.textContent ?? "")) el.style.display = "none";
      }
    });
    // Scroll through once so lazy images load, then wait briefly for them.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += 600) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(100);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1500);
    await page.evaluate(async () => {
      const pending = [...document.images]
        .filter((img) => !img.complete)
        .map((img) => new Promise((done) => { img.onload = img.onerror = done; }));
      await Promise.race([Promise.all(pending), new Promise((done) => setTimeout(done, 8000))]);
    });

    const sections = await page.evaluate(() => {
      const rows = [];
      for (const el of document.querySelectorAll("[data-sanity]")) {
        const match = el.getAttribute("data-sanity")?.match(/path=blocks:([^.;]+);/);
        if (!match || rows.some((r) => r.key === match[1])) continue;
        el.id = `page-shot-${match[1]}`;
        rows.push({ key: match[1], height: Math.round(el.getBoundingClientRect().height) });
      }
      return rows;
    });
    const renderedKeys = sections.map((s) => s.key);
    if (renderedKeys.length === 0) {
      throw new Error(`No Page Builder sections rendered for /${slug} at ${page.url()}.`);
    }
    if (JSON.stringify(renderedKeys) !== JSON.stringify(expectedKeys)) {
      throw new Error(
        `Rendered sections do not match ${pageDoc._id}. Draft mode is probably off.\n` +
          `  expected: ${expectedKeys.join(", ")}\n  rendered: ${renderedKeys.join(", ")}`,
      );
    }
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    let index = 0;
    for (const section of sections) {
      index += 1;
      const file = path.join(out, `${String(index).padStart(2, "0")}-${section.key}.png`);
      await (await page.$(`#page-shot-${section.key}`)).screenshot({ path: file });
    }
    console.log(JSON.stringify({ viewport: name, dir: out, pageHeight, sections }));
  } finally {
    await browser.close();
  }
}

for (const [name, viewport] of Object.entries(viewports)) {
  if (only && only !== name) continue;
  await shoot(name, viewport);
}
