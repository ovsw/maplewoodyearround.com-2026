import { createHash } from 'node:crypto';

export const SITE_ID = '673ebf0eedfc15a41bedc0c3';
export const SOURCE_ORIGIN = 'https://www.maplewoodyearround.com';
export const hash = (value) => createHash('sha256').update(value).digest('hex');

export async function request(url, options = {}, fetcher = fetch) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetcher(url, { ...options, signal: AbortSignal.timeout(120000) });
    if (response.status !== 429 && response.status < 500) return response;
    if (attempt === 5) throw new Error(`Source request failed after retries: HTTP ${response.status}`);
    const delay = Number(response.headers.get('retry-after')) || 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 120) * 1000));
  }
}

export function webflowReader(token, fetcher = fetch) {
  if (!token) throw new Error('WEBFLOW_API_TOKEN is required');
  const get = async (pathname) => {
    const response = await request(`https://api.webflow.com/v2${pathname}`, {
      headers: { Authorization: `Bearer ${token}` },
    }, fetcher);
    if (!response.ok) throw new Error(`Webflow ${pathname.split('?')[0]}: HTTP ${response.status}`);
    return response.json();
  };
  const list = async (pathname, key) => {
    const all = [];
    let total;
    do {
      const result = await get(`${pathname}${pathname.includes('?') ? '&' : '?'}limit=100&offset=${all.length}`);
      if (!Array.isArray(result[key])) throw new Error(`Missing ${key} in Webflow response`);
      const reported = result.pagination?.total;
      if (!Number.isInteger(reported) || reported < 0) throw new Error('Webflow pagination has no total');
      if (total !== undefined && total !== reported) throw new Error('Webflow count changed during pagination; capture again');
      total = reported;
      all.push(...result[key]);
      if (!result[key].length && all.length < total) throw new Error('Incomplete Webflow pagination');
    } while (all.length < total);
    if (all.length !== total) throw new Error('Webflow count changed during pagination; capture again');
    return all;
  };
  return { get, list };
}

export async function captureSource(token, referencePages, { fetcher = fetch, progress = () => {} } = {}) {
  const api = webflowReader(token, fetcher);
  const startedAt = new Date().toISOString();
  const site = await api.get(`/sites/${SITE_ID}`);
  if (site.id !== SITE_ID) throw new Error('Unexpected Webflow site');
  if ((site.locales?.secondary ?? []).length) throw new Error('Multiple locales need an explicit import mapping');
  const collections = [];
  // Webflow's collection index is not paginated; item, asset and page lists are.
  const collectionIndex = await api.get(`/sites/${SITE_ID}/collections`);
  if (!Array.isArray(collectionIndex.collections)) throw new Error('Missing collection index');
  for (const summary of collectionIndex.collections) {
    const schema = await api.get(`/collections/${summary.id}`);
    const staged = await api.list(`/collections/${summary.id}/items`, 'items');
    const live = await api.list(`/collections/${summary.id}/items/live`, 'items');
    collections.push({ ...schema, staged, live });
    progress({ collection: schema.displayName, staged: staged.length, live: live.length });
  }
  const pageRecords = await api.list(`/sites/${SITE_ID}/pages`, 'pages');
  const assets = await api.list(`/sites/${SITE_ID}/assets`, 'assets');
  const pages = [];
  for (const reference of referencePages) {
    const url = new URL(reference.path, SOURCE_ORIGIN).href;
    const response = await request(url, {}, fetcher);
    if (!response.ok && response.status !== 404) throw new Error(`Public page ${reference.path}: HTTP ${response.status}`);
    const html = await response.text();
    pages.push({ path: reference.path, url, finalUrl: response.url || url, status: response.status, html, sha256: hash(html) });
  }
  // The full live HTML contains expanded components and exact section boundaries.
  // Keep API DOM too, so static text that is not currently rendered is auditable.
  const pageDom = {};
  const componentDom = {};
  for (const page of pageRecords.filter((p) => !p.collectionId)) {
    const nodes = await api.list(`/pages/${page.id}/dom`, 'nodes');
    pageDom[page.id] = nodes;
    const componentIds = new Set(nodes.filter((n) => n.type === 'component-instance').map((n) => n.componentId));
    const pending = [...componentIds];
    while (pending.length) {
      const id = pending.shift();
      if (!id || componentDom[id]) continue;
      const children = await api.list(`/sites/${SITE_ID}/components/${id}/dom`, 'nodes');
      componentDom[id] = children;
      pending.push(...children.filter((n) => n.type === 'component-instance').map((n) => n.componentId));
    }
  }
  return { version: 1, siteId: SITE_ID, startedAt, capturedAt: new Date().toISOString(), collections, pageRecords, assets, pages, pageDom, componentDom,
    complete: {collections:collections.map((c)=>({id:c.id,staged:c.staged.length,live:c.live.length})),pageRecords:pageRecords.length,assets:assets.length,routes:referencePages.map((p)=>p.path)} };
}
