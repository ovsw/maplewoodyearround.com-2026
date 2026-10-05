import { JSDOM } from 'jsdom';
import { hash, SOURCE_ORIGIN } from './source.mjs';

export const key = (value) => hash(String(value)).slice(0, 16);
export const reference = (_ref) => ({ _type: 'reference', _ref });
export const documentId = (collection, item) => `wf-${collection}-${item}`;
export const htmlDocument = (html) => new JSDOM(html, { url: SOURCE_ORIGIN }).window.document;
export const text = (node) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

export function mediaUrl(value, base = SOURCE_ORIGIN) {
  if (!value || typeof value !== 'string') return undefined;
  const url = new URL(value, base);
  if (url.protocol !== 'https:') return undefined;
  if (!/(^|\.)(website-files\.com|webflow\.com)$/.test(url.hostname) && !(url.hostname === 's3.amazonaws.com' && url.pathname.startsWith('/webflow-prod-assets/'))) return undefined;
  url.hash = '';
  return url.href;
}

export function assetCollector(aliases = new Map()) {
  const assets = new Map();
  function asset(value, kind = 'image', alt) {
    const raw = typeof value === 'string' ? value : value?.url;
    if (!raw) return undefined;
    const source = mediaUrl(raw);
    const url = aliases.get(source) ?? source;
    if (!url) throw new Error('A source media URL has an unsupported host');
    const token = `import-asset-${key(url)}`;
    if (assets.has(url) && assets.get(url).kind !== kind) throw new Error('Media kind conflict');
    const known = assets.get(url) ?? { url, token, kind, aliases: [] };
    if (source !== url && !known.aliases.includes(source)) known.aliases.push(source);
    assets.set(url, known);
    return { _type: kind, asset: reference(token), ...(kind === 'image' ? { alt: alt ?? value?.alt ?? '' } : {}) };
  }
  return { assets, asset };
}

export function destination(raw, context) {
  if (!raw || !raw.trim() || raw.trim() === '#') return undefined;
  const value = raw.trim();
  // A link to a section of the same page keeps its fragment only.
  if (/^#[A-Za-z][\w-]*$/.test(value)) return { _type: 'contentDestination', kind: 'external', external: value };
  let url;
  try { url = new URL(value, SOURCE_ORIGIN); } catch { context.warnings.add('invalid-destination'); return undefined; }
  if (!['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) || url.hostname.toLowerCase() === 'seasons' || url.username || url.password) {
    context.warnings.add('invalid-destination'); return undefined;
  }
  if (mediaUrl(url.href) && /\.(pdf|docx?|xlsx?|zip)(?:\?|$)/i.test(url.href)) {
    return { _type: 'contentDestination', kind: 'file', file: context.asset(url.href, 'file') };
  }
  if (['www.maplewoodyearround.com', 'maplewoodyearround.com'].includes(url.hostname)) {
    const path = url.pathname.replace(/\/$/, '') || '/';
    const id = context.routes.get(path);
    if (id && !url.search && !url.hash) return { _type: 'contentDestination', kind: 'internal', internal: reference(id) };
    return { _type: 'contentDestination', kind: 'external', external: path + url.search + url.hash };
  }
  return { _type: 'contentDestination', kind: 'external', external: url.href };
}

export function customUrl(target) {
  if (!target) return undefined;
  const { kind, _type: ignored, ...fields } = target;
  return { _type: 'customUrl', type: kind, ...fields };
}

export function plainBlocks(value, prefix = 'text') {
  return String(value ?? '').split(/\n\s*\n/).filter(Boolean).map((line, i) => ({
    _key: key(`${prefix}-${i}`), _type: 'block', style: 'normal', markDefs: [],
    children: [{ _key: key(`${prefix}-${i}-s`), _type: 'span', text: line, marks: [] }],
  }));
}

// Parse as inert HTML. Only known text, link, image and table shapes become
// editor content. Scripts, style rules and iframe markup are never executed.
export function portableText(html, context, prefix = 'html') {
  const root = typeof html === 'string' ? htmlDocument(html).body : html;
  const result = [];
  let blockIndex = 0;
  const blockTags = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI']);
  const skipped = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG', 'TEMPLATE', 'BUTTON', 'INPUT']);
  function inline(node, spans, definitions, marks = []) {
    if (node.nodeType === 3) {
      if (node.nodeValue) spans.push({ _key: key(`${prefix}-${blockIndex}-s${spans.length}`), _type: 'span', text: node.nodeValue.replace(/[\t\r\n]+/g, ' '), marks });
      return;
    }
    if (skipped.has(node.tagName)) return;
    if (node.tagName === 'BR') { spans.push({ _key: key(`${prefix}-${blockIndex}-s${spans.length}`), _type: 'span', text: '\n', marks }); return; }
    let nextMarks = marks;
    if (['B', 'STRONG'].includes(node.tagName)) nextMarks = [...marks, 'strong'];
    if (['I', 'EM'].includes(node.tagName)) nextMarks = [...marks, 'em'];
    // The live yellow marker is bold text on a highlight (only /history uses it).
    if (node.classList?.contains('bg-highlighted')) nextMarks = [...new Set([...marks, 'strong', 'highlight'])];
    if (node.tagName === 'A') {
      const target = destination(node.getAttribute('href'), context);
      if (target) {
        const id = key(`${prefix}-${blockIndex}-link${definitions.length}`);
        definitions.push({ _key: id, _type: 'customLink', customLink: customUrl(target) });
        nextMarks = [...marks, id];
      }
    }
    for (const child of node.childNodes) inline(child, spans, definitions, nextMarks);
  }
  function emit(node, style = 'normal', extra = {}) {
    const children = [], markDefs = [];
    inline(node, children, markDefs);
    if (!children.some((span) => span.text.trim())) return;
    result.push({ _key: key(`${prefix}-${blockIndex++}`), _type: 'block', style, children, markDefs, ...extra });
  }
  function walk(node, level = 0) {
    if (node.nodeType === 3) { if (node.nodeValue.trim()) emit(node); return; }
    if (node.nodeType !== 1) return;
    if (skipped.has(node.tagName)) return;
    if (node.tagName === 'IMG') {
      const image = context.asset(node.getAttribute('src'), 'image', node.getAttribute('alt') ?? '');
      if (image) result.push({ ...image, _key: key(`${prefix}-${blockIndex++}`) });
      return;
    }
    if (node.tagName === 'TABLE') {
      result.push({ _key: key(`${prefix}-${blockIndex++}`), _type: 'table', rows: [...node.querySelectorAll('tr')].map((row, i) => ({
        _key: key(`${prefix}-r${i}`), _type: 'tableRow', cells: [...row.querySelectorAll('th,td')].map(text),
      })) });
      return;
    }
    if (blockTags.has(node.tagName)) {
      const clone = node.cloneNode(true);
      clone.querySelectorAll('ul,ol,img,script,style').forEach((child) => child.remove());
      const style = node.tagName === 'H1' ? 'h2' : /^H[2-6]$/.test(node.tagName) ? node.tagName.toLowerCase() : node.tagName === 'BLOCKQUOTE' ? 'blockquote' : 'normal';
      emit(clone, style, node.tagName === 'LI' ? { listItem: node.parentElement?.tagName === 'OL' ? 'number' : 'bullet', level: Math.max(1, level) } : {});
      node.querySelectorAll(':scope > ul, :scope > ol, img').forEach((child) => walk(child, level));
      return;
    }
    const children = [...node.childNodes];
    const hasBlocks = children.some((child) => blockTags.has(child.tagName) || ['DIV', 'SECTION', 'UL', 'OL', 'TABLE'].includes(child.tagName));
    if (!hasBlocks && !['HTML', 'BODY'].includes(node.tagName) && !node.querySelector('img,iframe,video')) { emit(node); return; }
    for (const child of children) walk(child, level + (['UL', 'OL'].includes(node.tagName) ? 1 : 0));
  }
  walk(root);
  return result;
}
