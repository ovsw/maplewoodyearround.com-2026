import {createRequire} from 'node:module';
import {mkdir, readFile, writeFile, copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const referenceDir = path.join(root, 'docs/migration/reference');
export const viewports = [{width: 1440, height: 1000}, {width: 390, height: 844}];
const liveOrigin = 'https://www.maplewoodyearround.com';

export function pagePath(value) {
  if (!value.startsWith('/') || value.startsWith('//') || /[?#\\]/.test(value)) {
    throw new Error('Use a page path, such as /summer-camp, without a query or fragment.');
  }
  if (value.split('/').some((part) => ['.', '..'].includes(decodeURIComponent(part)))) {
    throw new Error('Relative path segments are not allowed.');
  }
  return value === '/' ? '/' : value.replace(/\/+$/, '');
}

export function imageName(route, width) {
  const name = pagePath(route).slice(1) || 'home';
  return `${name}-${width}.png`;
}

async function launchBrowser() {
  const require = createRequire(path.join(root, 'frontend/package.json'));
  const {chromium} = require('@playwright/test');
  return chromium.launch();
}

// Exercise real scroll triggers and lazy loading. Do not force opacity, remove
// headers, or replace the site's layout to make the screenshot look complete.
export async function settlePage(page) {
  await page.evaluate(() => Promise.race([
    document.fonts.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Fonts did not settle within 30 seconds.')), 30000)),
  ]));
  await page.waitForTimeout(1200);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  if (height > 100000) throw new Error(`Unexpected page height: ${height}px. Inspect before capture.`);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(async () => {
    await Promise.all([...document.images].map(async (image) => {
      if (image.complete || !image.checkVisibility()) return;
      await Promise.race([
        new Promise((resolve) => {
          image.addEventListener('load', resolve, {once: true});
          image.addEventListener('error', resolve, {once: true});
        }),
        new Promise((resolve) => setTimeout(resolve, 8000)),
      ]);
    }));
    for (const video of document.querySelectorAll('video')) video.pause();
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1800);
}

async function screenshot(browser, url, viewport, destination) {
  const context = await browser.newContext({viewport, deviceScaleFactor: 1});
  const page = await context.newPage();
  try {
    console.log(`Loading ${url} at ${viewport.width}px`);
    const response = await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 90000});
    if (!response?.ok()) throw new Error(`${url}: HTTP ${response?.status() ?? 'no response'}`);
    await settlePage(page);
    const details = await page.evaluate(() => ({
      title: document.title,
      finalUrl: location.href,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      failedImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => ({src: image.currentSrc || image.src, alt: image.alt, visible: image.checkVisibility()})),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    }));
    await mkdir(path.dirname(destination), {recursive: true});
    // Keep the requested viewport width when the live page overflows sideways.
    await page.screenshot({path: destination, fullPage: true,
      clip: {x: 0, y: 0, width: viewport.width, height: details.documentHeight},
      animations: 'disabled', timeout: 90000});
    return {capturedAt: new Date().toISOString(), viewport, ...details};
  } finally {
    await context.close();
  }
}

export async function captureReferences(resume = false, refreshPath) {
  const response = await fetch(`${liveOrigin}/sitemap.xml`);
  if (!response.ok) throw new Error(`Sitemap: HTTP ${response.status}`);
  const sitemap = await response.text();
  const routes = [...new Set([
    ...[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => {
      const url = new URL(match[1]);
      if (url.origin !== liveOrigin) throw new Error(`Unexpected sitemap origin: ${url.origin}`);
      return pagePath(url.pathname);
    }),
    '/privacy-policy', '/terms-and-conditions', '/cookie-policy',
  ])];
  if (routes.length !== 53) throw new Error(`Expected 53 reference pages; found ${routes.length}. Inspect the sitemap before replacing the baseline.`);
  const manifest = resume ? JSON.parse(await readFile(path.join(referenceDir, 'manifest.json'), 'utf8')) : {
    source: liveOrigin, sitemap: `${liveOrigin}/sitemap.xml`,
    method: 'Chromium, device scale 1, normal motion, real scroll pass, fonts and lazy images awaited, videos paused, top of page, fullPage screenshot. Scroll-dependent sections retain their scroll-zero state. Sliders retain the loaded state; individual slides are not combined.',
    pages: [],
  };
  if (refreshPath) {
    refreshPath = pagePath(refreshPath);
    if (!resume || !routes.includes(refreshPath)) throw new Error('Use --resume --path with an existing sitemap or policy path.');
    manifest.pages = manifest.pages.filter((item) => item.path !== refreshPath);
  }
  const browser = await launchBrowser();
  try {
    for (const route of routes) {
      const captures = await Promise.all(viewports.map(async (viewport) => {
        const file = imageName(route, viewport.width);
        if (manifest.pages.some((item) => item.path === route && item.viewport.width === viewport.width)) {
          await readFile(path.join(referenceDir, file));
          return null;
        }
        const details = await screenshot(browser, `${liveOrigin}${route}`, viewport, path.join(referenceDir, file));
        return {path: route, file, ...details};
      }));
      if (!captures.some(Boolean)) continue;
      manifest.pages.push(...captures.filter(Boolean));
      // A partial manifest survives a network failure. It never claims completion.
      manifest.expectedCaptures = routes.length * viewports.length;
      manifest.completedCaptures = manifest.pages.length;
      manifest.complete = manifest.completedCaptures === manifest.expectedCaptures;
      await writeFile(path.join(referenceDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
      console.log(`${manifest.pages.length}/106 ${route}`);
    }
  } finally {
    await browser.close();
  }
}

const escapeHtml = (text) => text.replace(/[&<>"']/g, (character) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));

export async function compare(route, origin) {
  route = pagePath(route);
  const manifest = JSON.parse(await readFile(path.join(referenceDir, 'manifest.json'), 'utf8'));
  const references = viewports.map((viewport) => {
    const reference = manifest.pages.find((item) => item.path === route && item.viewport.width === viewport.width);
    if (!reference) throw new Error(`No ${viewport.width}px reference exists for ${route}.`);
    return reference;
  });
  if (!origin) {
    const ports = await readFile(path.join(root, '.worktree-ports.json'), 'utf8').then(JSON.parse).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
      return {frontendPort: 3000};
    });
    origin = `http://127.0.0.1:${ports.frontendPort}`;
  }
  const base = new URL(origin);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== '/') {
    throw new Error('REF_BASE_URL must be an HTTP(S) origin without credentials, path, query or fragment.');
  }
  const output = path.join(root, '.reference-comparisons', route.slice(1) || 'home');
  await mkdir(output, {recursive: true});
  const browser = await launchBrowser();
  const results = [];
  try {
    for (const reference of references) {
      const width = reference.viewport.width;
      await copyFile(path.join(referenceDir, reference.file), path.join(output, `reference-${width}.png`));
      const details = await screenshot(browser, `${base.origin}${route}`, reference.viewport, path.join(output, `current-${width}.png`));
      results.push({width, referenceCapturedAt: reference.capturedAt, ...details});
    }
  } finally {
    await browser.close();
  }
  await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify(results, null, 2)}\n`);
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Reference comparison: ${escapeHtml(route)}</title><style>body{font:16px system-ui;margin:24px;background:#eee;color:#111}section{margin:32px 0;overflow:auto}.pair{display:flex;gap:16px;align-items:flex-start}figure{margin:0;flex:none}img{display:block;max-width:none}figcaption{padding:12px 0}</style><h1>${escapeHtml(route)}</h1><p>Reference and current page at identical widths. Scroll horizontally at 1440 px. This report does not give a pass or fail verdict.</p>${results.map((item) => `<section><h2>${item.width} px</h2><div class="pair"><figure><figcaption>Live reference: ${escapeHtml(item.referenceCapturedAt)}</figcaption><img width="${item.width}" src="reference-${item.width}.png" alt="Live reference at ${item.width} pixels"></figure><figure><figcaption>Current: ${escapeHtml(item.capturedAt)}</figcaption><img width="${item.width}" src="current-${item.width}.png" alt="Current page at ${item.width} pixels"></figure></div></section>`).join('')}</html>`;
  await writeFile(path.join(output, 'index.html'), html);
  console.log(path.join(output, 'index.html'));
}

export async function captureScrollStates() {
  const browser = await launchBrowser();
  const states = [];
  try {
    const pages = [
      {route: '/', name: 'home', sections: [
        {name: 'video-zoom', selector: '.section_header83', fractions: [0, 0.5, 1]},
        {name: 'image-text', selector: '.section_layout515', fractions: [0, 1 / 3, 2 / 3, 1]},
        {name: 'bus', selector: '.section_transportation_contact14', fractions: [0, 1]},
        {name: 'year-round', selector: '.section_layout412', viewportOffsets: [-0.9, -0.4, 0]},
      ]},
      {route: '/school-year', name: 'school-year', sections: [
        {name: 'video-zoom', selector: '.section_header83', fractions: [0, 0.5, 1]},
      ]},
      {route: '/summer-camp/my-hot-lunchbox', name: 'hot-lunch', sections: [
        {name: 'steps', selector: '.layout486_component', fractions: [0, 0.3, 0.6, 1]},
      ]},
    ];
    for (const {route, name, sections} of pages) {
      for (const viewport of viewports) {
        const context = await browser.newContext({viewport, deviceScaleFactor: 1});
        const page = await context.newPage();
        await page.goto(`${liveOrigin}${route}`, {waitUntil: 'domcontentloaded'});
        await settlePage(page);
        for (const section of sections) {
          if (section.viewportOffsets) {
            // A one-time entrance animation must be captured before its first
            // trigger. Reload so the earlier lazy-load pass has not fired it.
            await page.reload({waitUntil: 'domcontentloaded'});
            await page.waitForFunction(() => document.fonts.status === 'loaded');
            await page.waitForTimeout(1200);
          }
          const box = await page.locator(section.selector).evaluate((element) => ({
            top: element.getBoundingClientRect().top + window.scrollY,
            height: element.getBoundingClientRect().height,
          }));
          for (const [index, position] of (section.fractions ?? section.viewportOffsets).entries()) {
            const scrollY = Math.round(box.top + (section.viewportOffsets
              ? viewport.height * position
              : Math.max(0, box.height - viewport.height) * position));
            await page.evaluate((top) => window.scrollTo(0, top), scrollY);
            await page.waitForTimeout(1800);
            const file = `states/${name}-${section.name}-${index + 1}-${viewport.width}.png`;
            await mkdir(path.join(referenceDir, 'states'), {recursive: true});
            await page.screenshot({path: path.join(referenceDir, file), animations: 'disabled'});
            const actualScrollY = await page.evaluate(() => window.scrollY);
            states.push({path: route, file, section: section.selector, position,
              positionUnit: section.viewportOffsets ? 'viewport offset before section' : 'section scroll fraction',
              scrollY: actualScrollY, viewport, capturedAt: new Date().toISOString()});
            console.log(file);
          }
        }
        await context.close();
      }
    }
    await writeFile(path.join(referenceDir, 'states/manifest.json'), `${JSON.stringify({source: liveOrigin, method: 'Real viewport captures at actual scroll offsets; no layout or opacity changes.', states}, null, 2)}\n`);
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, route = '/'] = process.argv.slice(2);
  try {
    if (mode === 'capture') {
      const pathIndex = process.argv.indexOf('--path');
      if (pathIndex !== -1 && !process.argv[pathIndex + 1]) throw new Error('--path needs a page path.');
      await captureReferences(process.argv.includes('--resume'), pathIndex === -1 ? undefined : process.argv[pathIndex + 1]);
    }
    else if (mode === 'states') await captureScrollStates();
    else if (mode === 'compare') await compare(route, process.env.REF_BASE_URL);
    else throw new Error('Use pnpm ref:capture or pnpm ref:compare <path>.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
