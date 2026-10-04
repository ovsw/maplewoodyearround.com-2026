import { assetCollector, documentId, key, reference, text, destination, portableText, mediaUrl } from './html.mjs';
import { mappings, identityMap, cmsDocuments } from './collections.mjs';
import { pageContext, staticPages, pageId } from './pages.mjs';
import { SITE_ID } from './source.mjs';

function summerDocuments(snapshot, context) {
  const pages = ['/summer-camp/summer-group-schedules', '/summer-camp/summer-camp-welcome-letters'].map((path) => context.pageDocuments.get(path));
  const years = new Set(pages.map((page) => text(page.querySelector('main header')).match(/updated[^0-9]*(?:\w+\s+)?\d+\w*\s+(20\d\d)/i)?.[1]));
  if (years.size !== 1 || years.has(undefined)) throw new Error('Summer document pages do not establish one matching source year');
  const year = [...years][0];
  const groups = snapshot.collections.find((c) => c.displayName === 'SC Groups');
  const grades = snapshot.collections.find((c) => c.displayName === 'SC Grades');
  const gradeOrder = text(pages[0].querySelector('main'));
  const build = (version) => ({
    _id: `wf-summer-documents-${year}`, _type: 'summerDocuments', seasonLabel: `Summer ${year}`,
    gradeGroups: [...grades[version]].sort((a, b) => gradeOrder.indexOf(a.fieldData.name) - gradeOrder.indexOf(b.fieldData.name)).map((grade) => ({
      _key: key(grade.id), _type: 'gradeDocuments', grade: reference(documentId(grades.id, grade.id)),
      entries: groups[version].filter((group) => group.fieldData['entering-grade-2']?.includes(grade.id)).flatMap((group) =>
        [['group-schedule-pdf', 'schedule'], ['welcome-letter-pdf', 'welcomeLetter']].flatMap(([field, kind]) => group.fieldData[field]?.url ? [{
          _key: key(`${group.id}-${kind}`), _type: 'summerDocumentEntry', title: group.fieldData.name, kind,
          group: reference(documentId(groups.id, group.id)), file: context.asset(group.fieldData[field], 'file'),
        }] : [])),
    })),
  });
  const live = build('live'), staged = build('staged');
  return JSON.stringify(live) === JSON.stringify(staged) ? [live] : [live, { ...staged, _id: `drafts.${staged._id}` }];
}

function authoredCollections(snapshot, context) {
  const documents = new Map();
  for (const [path, dom] of context.pageDocuments) {
    for (const node of dom.querySelectorAll('.summer-camp_programs_card, .summer-camp_additional-programs_item')) {
      const title = text(node.querySelector('h2,h3,h4'));
      if (!title) continue;
      const id = `wf-authored-program-${key(title)}`;
      const image = node.querySelector('img[src]');
      const link = node.matches('a[href]') ? node : node.querySelector('a[href]');
      const doc = {
        _id: id, _type: 'programOffering', title, program: 'summerCamp', visible: true,
        listingGroup: node.classList.contains('summer-camp_additional-programs_item') ? 'additional' : 'main',
        description: text(node), ...(image ? { image: context.asset(image.src, 'image', image.alt) } : {}),
        ...(link ? { destination: destination(link.getAttribute('href'), context) } : {}),
        order: documents.size,
      };
      if (!documents.has(id)) documents.set(id, doc);
    }
    if (path !== '/leadership') continue;
    for (const [index, node] of [...dom.querySelectorAll('.team14_item')].entries()) {
      const wrapper = node.querySelector('.team14_title-wrapper');
      const name = text(wrapper?.firstElementChild);
      if (!name) throw new Error('A leadership profile lacks a source name');
      const image = node.querySelector('img[src]');
      const content = node.cloneNode(true);
      content.querySelectorAll('img,.team14_title-wrapper').forEach((e) => e.remove());
      documents.set(`wf-authored-leader-${key(name)}`, {
        _id: `wf-authored-leader-${key(name)}`, _type:'staffMember', name, profileGroup:'leadership', program:'summerCamp', visible:true,
        role:text(wrapper?.lastElementChild), bio:portableText(content,context,`leader-${index}`), order:index,
        ...(image ? {image:context.asset(image.src,'image',image.alt)} : {}),
        ...(node.querySelector('a[href^="mailto:"]') ? {email:node.querySelector('a[href^="mailto:"]').getAttribute('href').slice(7)} : {}),
      });
    }
  }
  return [...documents.values()];
}

export function buildPlan(snapshot, schema) {
  if (snapshot.version !== 1 || snapshot.siteId !== SITE_ID || !snapshot.capturedAt) throw new Error('Incomplete or wrong source snapshot');
  const names = snapshot.collections.map((c) => c.displayName).sort();
  if (JSON.stringify(names) !== JSON.stringify(Object.keys(mappings).sort())) throw new Error('The snapshot does not contain all mapped collections');
  for (const collection of snapshot.collections) for (const version of ['staged','live']) {
    if (!Array.isArray(collection[version]) || new Set(collection[version].map((i) => i.id)).size !== collection[version].length) throw new Error('Incomplete or duplicate source item list');
  }
  const aliases = new Map();
  for (const asset of snapshot.assets) if (asset.contentType?.startsWith('image/')) {
    for (const variant of asset.variants ?? []) if (variant.hostedUrl) aliases.set(mediaUrl(variant.hostedUrl),mediaUrl(asset.hostedUrl));
  }
  const context = pageContext(snapshot, { ...assetCollector(aliases), identities:identityMap(snapshot), warnings:new Set() });
  const cms = cmsDocuments(snapshot, context);
  const pages = staticPages(snapshot, context, schema);
  const extras = [...summerDocuments(snapshot, context), ...authoredCollections(snapshot, context)];
  const summer = extras.find((doc) => doc._type === 'summerDocuments');
  for (const doc of pages.documents) for (const block of doc.blocks ?? []) if (block._type === 'summerDocumentList') block.documents = reference(summer._id);
  // Preserve every CMS media field, including currently unused dashboard files.
  for (const collection of snapshot.collections) for (const item of [...collection.staged,...collection.live]) {
    for (const field of collection.fields.filter((f) => ['Image','File'].includes(f.type))) {
      if (item.fieldData[field.slug]?.url) context.asset(item.fieldData[field.slug],field.type === 'Image' ? 'image' : 'file');
    }
  }
  // All observed static assets and background files, independent of whether a
  // later page renderer already has a slot for each one.
  for (const dom of context.pageDocuments.values()) {
    for (const node of dom.querySelectorAll('main img[src],main source[src],main video[poster],[data-poster-url]')) {
      const url = node.getAttribute('src') || node.getAttribute('poster') || node.getAttribute('data-poster-url');
      if (mediaUrl(url)) context.asset(url,node.tagName === 'SOURCE' ? 'file' : 'image',node.getAttribute('alt') ?? '');
    }
    for (const node of dom.querySelectorAll('main [style]')) for (const match of node.getAttribute('style').matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      if (mediaUrl(match[1])) context.asset(match[1],'image');
    }
  }
  const fourth = snapshot.assets.find((asset) => asset.id === '6763085f54fa6308aa7d9c7e');
  if (!fourth) throw new Error('Required fourth background video is missing from the source asset API');
  context.asset(fourth.hostedUrl,'file');
  for (const variant of fourth.variants ?? []) context.asset(variant.hostedUrl,variant.format === 'jpg' ? 'image' : 'file');
  const documents = JSON.parse(JSON.stringify([...cms.documents, ...pages.documents, ...extras]));
  const ids = new Set(documents.map((d) => d._id));
  if (ids.size !== documents.length) throw new Error('Duplicate target IDs');
  const unknownRefs = [];
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (value._type === 'reference' && !value._ref.startsWith('import-asset-') && !ids.has(value._ref) && !ids.has(`drafts.${value._ref}`)) unknownRefs.push(value._ref);
    for (const child of Object.values(value)) visit(child);
  }
  documents.forEach(visit);
  if (unknownRefs.length) throw new Error(`${new Set(unknownRefs).size} unresolved target references`);
  return {documents,assets:[...context.assets.values()],counts:cms.counts,coverage:pages.coverage,gaps:pages.gaps,warnings:[...context.warnings],missingRoutes:snapshot.pages.filter((p)=>p.status!==200).map((p)=>({path:p.path,status:p.status}))};
}
