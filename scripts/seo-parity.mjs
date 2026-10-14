import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Compares the live Webflow site with the new site, page by page, before the
// domain switch. Usage:
//   node scripts/seo-parity.mjs [new origin] [--json <file>]
// The new origin defaults to the Vercel production URL.

export const liveOrigin = 'https://www.maplewoodyearround.com';
export const canonicalOrigin = 'https://www.maplewoodyearround.com';
const defaultNewOrigin = 'https://maplewoodyearround-com-2026.vercel.app';
export const policyPaths = ['/privacy-policy', '/terms-and-conditions', '/cookie-policy'];
// Old Webflow paths with a 301 on the live site, and where they lead.
export const knownRedirects = {
  '/school-year/programs/indoor-outdoor-playground': '/school-year/programs/indoor-outdoor-play-center',
};

// Tags compared by value. Images are compared by presence only: Webflow and
// Sanity serve the same picture from different CDN URLs.
export const valueTags = ['title', 'description', 'og:title', 'og:description', 'og:type', 'twitter:title', 'twitter:description', 'twitter:card'];
export const presenceTags = ['og:image', 'twitter:image'];

const entities = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '};

export function decodeEntities(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, name) => {
    if (name[0] === '#') {
      const code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return entities[name.toLowerCase()] ?? match;
  });
}

function attributes(tag) {
  const result = {};
  for (const [, name, , double, single, bare] of tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[name.toLowerCase()] = decodeEntities(double ?? single ?? bare ?? '');
  }
  return result;
}

/** Reads the SEO tags from the <head>, whatever the attribute order. */
export function readSeoTags(html) {
  const head = html.split(/<\/head>/i)[0];
  const tags = {};
  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) tags.title = decodeEntities(title[1]).trim();
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const {name, property, content} = attributes(tag);
    const key = (property || name || '').toLowerCase();
    if (key && content !== undefined && !(key in tags)) tags[key] = content.trim();
  }
  for (const [tag] of head.matchAll(/<link\b[^>]*>/gi)) {
    const {rel, href} = attributes(tag);
    if (rel?.toLowerCase() === 'canonical' && !tags.canonical) tags.canonical = href;
  }
  tags.jsonLdTypes = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap(([, body]) => {
      try {
        const value = JSON.parse(body);
        return (value['@graph'] || [value]).map((item) => item['@type']).flat();
      } catch {
        return ['invalid'];
      }
    });
  return tags;
}

export function pathOf(url) {
  const {pathname} = new URL(url);
  return pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
}

export function expectedCanonical(pagePath) {
  return pagePath === '/' ? canonicalOrigin : `${canonicalOrigin}${pagePath}`;
}

function normalize(value) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

/** Lists every difference between one live page and the same new page. */
export function comparePage(pagePath, live, next) {
  const differences = [];
  if (next.status !== 200) differences.push({field: 'status', live: live.status, next: next.status});
  const canonical = next.tags.canonical?.replace(/\/$/, '');
  if (canonical !== expectedCanonical(pagePath)) {
    differences.push({field: 'canonical', live: expectedCanonical(pagePath), next: next.tags.canonical ?? null});
  }
  if (next.tags.robots?.includes('noindex')) differences.push({field: 'robots', live: 'index', next: next.tags.robots});
  if (!live.tags) return differences;
  for (const field of valueTags) {
    const a = normalize(live.tags[field]);
    const b = normalize(next.tags[field]);
    if (a && a !== b) differences.push({field, live: a, next: b || null});
  }
  for (const field of presenceTags) {
    if (live.tags[field] && !next.tags[field]) differences.push({field, live: 'present', next: null});
  }
  const liveTypes = live.tags.jsonLdTypes.filter((type) => type !== 'invalid');
  for (const type of new Set(liveTypes)) {
    if (!next.tags.jsonLdTypes.includes(type)) differences.push({field: 'json-ld', live: type, next: null});
  }
  return differences;
}

function request(url) {
  return fetch(url, {redirect: 'manual', headers: {'user-agent': 'maplewood-seo-parity'}});
}

async function fetchPage(url) {
  const response = await request(url);
  const html = response.status === 200 ? await response.text() : '';
  return {status: response.status, tags: html ? readSeoTags(html) : {jsonLdTypes: []}, robotsHeader: response.headers.get('x-robots-tag')};
}

/** robots.txt directives, compared without case or order. */
export function robotsDirectives(text) {
  return text.split('\n')
    .map((line) => line.replace(/#.*/, '').trim())
    .filter(Boolean)
    .map((line) => {
      const [key, ...value] = line.split(':');
      return `${key.trim().toLowerCase()}: ${value.join(':').trim()}`;
    })
    .filter((line, index, lines) => lines.indexOf(line) === index)
    .sort();
}

export function sitemapLocations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc.trim());
}

/** Site-wide checks: robots.txt, sitemap, redirects and the noindex header. */
export async function compareSite(newOrigin, livePaths) {
  const differences = [];
  const [liveRobots, newRobots] = await Promise.all(
    [liveOrigin, newOrigin].map(async (origin) => robotsDirectives(await (await request(`${origin}/robots.txt`)).text())),
  );
  for (const line of liveRobots) if (!newRobots.includes(line)) differences.push({field: 'robots.txt', live: line, next: null});
  for (const line of newRobots) if (!liveRobots.includes(line)) differences.push({field: 'robots.txt', live: null, next: line});

  const locations = sitemapLocations(await (await request(`${newOrigin}/sitemap.xml`)).text());
  const expected = new Set([...livePaths, ...policyPaths].map(expectedCanonical));
  for (const location of expected) if (!locations.includes(location)) differences.push({field: 'sitemap', live: location, next: null});
  for (const location of locations) if (!expected.has(location)) differences.push({field: 'sitemap', live: null, next: location});

  const redirects = {...knownRedirects, '/summer-camp/': '/summer-camp', '/news/': '/news'};
  for (const [from, to] of Object.entries(redirects)) {
    const response = await request(newOrigin + from);
    const location = response.headers.get('location');
    const target = location && pathOf(new URL(location, newOrigin).href);
    if (![301, 308].includes(response.status) || target !== to) {
      differences.push({field: `redirect ${from}`, live: `301 ${to}`, next: `${response.status} ${location ?? ''}`.trim()});
    }
  }

  // The canonical host is indexed; any other host of the new site is not.
  const header = (await request(`${newOrigin}/`)).headers.get('x-robots-tag') ?? '';
  const isCanonicalHost = new URL(newOrigin).host === new URL(canonicalOrigin).host;
  if (isCanonicalHost === header.includes('noindex')) {
    differences.push({field: 'x-robots-tag', live: isCanonicalHost ? null : 'noindex', next: header || null});
  }
  return differences;
}

export async function readLiveSitemap() {
  return sitemapLocations(await (await request(`${liveOrigin}/sitemap.xml`)).text()).map(pathOf);
}

export async function run(newOrigin = defaultNewOrigin) {
  const livePaths = await readLiveSitemap();
  const pages = [{path: 'site', differences: await compareSite(newOrigin, livePaths)}];
  for (const pagePath of new Set([...livePaths, ...policyPaths])) {
    const [live, next] = await Promise.all([fetchPage(liveOrigin + pagePath), fetchPage(newOrigin + pagePath)]);
    pages.push({path: pagePath, differences: comparePage(pagePath, live, next)});
  }
  return pages;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const jsonIndex = args.indexOf('--json');
  const jsonFile = jsonIndex >= 0 ? args.splice(jsonIndex, 2)[1] : null;
  const newOrigin = (args[0] || defaultNewOrigin).replace(/\/$/, '');
  const pages = await run(newOrigin);
  if (jsonFile) await writeFile(jsonFile, `${JSON.stringify(pages, null, 2)}\n`);
  let total = 0;
  for (const page of pages) {
    for (const difference of page.differences) {
      total += 1;
      console.log(`${page.path}  ${difference.field}\n  live: ${JSON.stringify(difference.live)}\n  new:  ${JSON.stringify(difference.next)}`);
    }
  }
  console.log(`\n${pages.length - 1} pages compared with ${newOrigin}; ${total} differences.`);
  process.exitCode = total ? 1 : 0;
}
