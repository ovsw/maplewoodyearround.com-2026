import { assetCollector, documentId, key, reference, text, destination, portableText, plainBlocks, mediaUrl } from './html.mjs';
import { mappings, identityMap, cmsDocuments } from './collections.mjs';
import { pageContext, staticPages, pageId } from './pages.mjs';
import { SITE_ID } from './source.mjs';
import { globalDocuments } from './globals.mjs';
import { assertNoSourceAssetUrls } from './write.mjs';

export function assertPublicPageCoverage(snapshot) {
  const publicPaths=new Set(snapshot.pages.filter((page)=>page.status===200).map((page)=>page.path));
  const systemPaths=new Set(['/401','/404']);
  if(snapshot.pageRecords.some((page)=>!page.collectionId&&!page.draft&&!page.archived&&!systemPaths.has(page.publishedPath)&&!publicPaths.has(page.publishedPath)))throw new Error('A published source page is absent from the captured public routes');
}

// Confirmed deleted template icon: HTTP 403 on the public CDN, no asset API
// record. It is decorative and absent from every planned document. Keep the
// private source evidence and report its omission; never skip other failures.
const unavailableTemplateIds=new Set(['624380709031626fc14aee84','6244257bf98bf0e23bb25fec','624380709031625abc4aee65','6294195f2d0c46815fb2259c']);
const unavailableDecorativeUrl='https://cdn.prod.website-files.com/6244257bf98bf00e37b25f97/6244257bf98bf0e23bb25fec_icon_close-modal.svg';


function summerDocuments(snapshot, context) {
  const pages = ['/summer-camp/summer-group-schedules', '/summer-camp/summer-camp-welcome-letters'].map((path) => context.pageDocuments.get(path));
  const years = new Set(pages.map((page) => text(page.querySelector('main header')).match(/updated[^0-9]*(?:\w+\s+)?\d+\w*\s+(20\d\d)/i)?.[1]));
  if (years.size !== 1 || years.has(undefined)) throw new Error('Summer document pages do not establish one matching source year');
  const year = [...years][0];
  const groups = snapshot.collections.find((c) => c.displayName === 'SC Groups');
  const grades = snapshot.collections.find((c) => c.displayName === 'SC Grades');
  const gradeOrder = text(pages[0].querySelector('main'));
  const links=[...pages[0].querySelectorAll('main a[href]')].map((a)=>a.href);
  const groupOrder=new Map(groups.live.map((group)=>[group.id,links.indexOf(group.fieldData['group-schedule-pdf']?.url)]));
  const build = (version) => ({
    _id: `wf-summer-documents-${year}`, _type: 'summerDocuments', seasonLabel: `Summer ${year}`,
    gradeGroups: [...grades[version]].sort((a, b) => gradeOrder.indexOf(a.fieldData.name) - gradeOrder.indexOf(b.fieldData.name)).map((grade) => ({
      _key: key(grade.id), _type: 'gradeDocuments', grade: reference(documentId(grades.id, grade.id)),
      entries: groups[version].filter((group) => group.fieldData['entering-grade-2']?.includes(grade.id)).sort((a,b)=>{
        const rank=(group)=>{const index=groupOrder.get(group.id);return index===undefined||index<0?Number.MAX_SAFE_INTEGER:index;};
        return rank(a)-rank(b)||a.id.localeCompare(b.id);
      }).flatMap((group) =>
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
        _id: `wf-authored-leader-${key(name)}`, _type:'staffMember', name, profileGroup:'leadership', visible:true,
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
  const complete = snapshot.complete;
  if (!complete || complete.pageRecords !== snapshot.pageRecords?.length || complete.assets !== snapshot.assets?.length ||
    complete.collections?.length !== snapshot.collections?.length || complete.routes?.length !== snapshot.pages?.length ||
    complete.routes.some((path) => !snapshot.pages.some((page) => page.path === path)) ||
    snapshot.pageRecords.some((page) => !page.collectionId && !Array.isArray(snapshot.pageDom?.[page.id]))) throw new Error('Source snapshot completeness check failed');
  for(const page of snapshot.pages.filter((page)=>page.status===404&&!page.path.startsWith('/post/'))) {
    const record=snapshot.pageRecords.find((record)=>record.publishedPath===page.path);
    if(record&&!record.draft&&!record.archived)throw new Error('A public source page is unavailable without a matching unpublished source state');
  }
  assertPublicPageCoverage(snapshot);
  const names = snapshot.collections.map((c) => c.displayName).sort();
  if (JSON.stringify(names) !== JSON.stringify(Object.keys(mappings).sort())) throw new Error('The snapshot does not contain all mapped collections');
  for (const collection of snapshot.collections) for (const version of ['staged','live']) {
    if (!Array.isArray(collection[version]) || complete.collections.find((c) => c.id === collection.id)?.[version] !== collection[version].length || new Set(collection[version].map((i) => i.id)).size !== collection[version].length) throw new Error('Incomplete or duplicate source item list');
  }
  const aliases = mediaAliases(snapshot);
  const context = pageContext(snapshot, { ...assetCollector(aliases), identities:identityMap(snapshot), warnings:new Set() });
  const cms = cmsDocuments(snapshot, context);
  const pages = staticPages(snapshot, context, schema);
  const extras = [...summerDocuments(snapshot, context), ...authoredCollections(snapshot, context), ...unpublishedPages(snapshot, context), ...globalDocuments(snapshot, context)];
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
    if (value._type === 'reference' && !value._ref.startsWith('import-asset-') && !ids.has(value._ref)) {
      if(ids.has(`drafts.${value._ref}`))value._weak=true;
      else unknownRefs.push(value._ref);
    }
    for (const child of Object.values(value)) visit(child);
  }
  documents.forEach(visit);
  if (unknownRefs.length) throw new Error(`${new Set(unknownRefs).size} unresolved target references`);
  assertNoSourceAssetUrls(documents);
  const unavailable=context.assets.get(unavailableDecorativeUrl);
  if(unavailable) {
    if(JSON.stringify(documents).includes(unavailable.token))throw new Error('Unavailable decorative source asset is now referenced by planned content');
    context.assets.delete(unavailableDecorativeUrl);
    context.warnings.add('unavailable-decorative-close-modal-icon');
  }
  return {documents,assets:[...context.assets.values()],counts:cms.counts,coverage:pages.coverage,gaps:pages.gaps,warnings:[...context.warnings],missingRoutes:snapshot.pages.filter((p)=>p.status!==200).map((p)=>({path:p.path,status:p.status}))};
}

function unpublishedPages(snapshot, context) {
  const publicPaths = new Set(snapshot.pages.filter((p)=>p.status===200).map((p)=>p.path));
  const assets = new Map(snapshot.assets.map((a)=>[a.id,a]));
  return snapshot.pageRecords.filter((page)=>!page.collectionId&&!publicPaths.has(page.publishedPath)).map((page)=>{
    const richText=[];
    let index=0;
    const visit=(nodes, ancestors=[])=>{
      for(const node of nodes) {
        const prefix=`${page.id}-${index++}`;
        if(node.type==='text') richText.push(...(node.text.html ? portableText(node.text.html,context,prefix) : plainBlocks(node.text.text,prefix)));
        if(node.type==='html-embed') richText.push(...portableText(node.html,context,prefix));
        if(node.type==='image') {
          const asset=assets.get(node.image.assetId);
          if(asset)richText.push({...context.asset(asset.hostedUrl,'image',node.image.alt??asset.altText??''),_key:key(prefix)});
          else if(node.image.assetId) {
            if(!unavailableTemplateIds.has(node.image.assetId))throw new Error('An unrecognized source template image is missing from the asset API');
            // Webflow templates can retain deleted library-image IDs. The API
            // cannot supply these assets; retain any authored alternative text.
            context.warnings.add('unpublished-template-image-unavailable');
            richText.push(...plainBlocks(node.image.alt,prefix));
          }
        }
        if(node.type==='component-instance') {
          if(ancestors.includes(node.componentId))throw new Error('Cyclic source component');
          const children=snapshot.componentDom[node.componentId];
          if(!children)throw new Error('Incomplete source component snapshot');
          visit(children,[...ancestors,node.componentId]);
          for(const [i,override] of (node.propertyOverrides??[]).entries())if(override.text)richText.push(...(override.text.html?portableText(override.text.html,context,`${prefix}-override-${i}`):plainBlocks(override.text.text,`${prefix}-override-${i}`)));
        }
      }
    };
    visit(snapshot.pageDom[page.id]);
    if(!page.publishedPath)throw new Error('Unpublished source page has no route');
    return {_id:`drafts.${pageId(page.publishedPath)}`,_type:'page',title:page.title,slug:{_type:'slug',current:page.publishedPath.slice(1)},
      description:`Preserved Webflow ${page.draft?'draft':'system page'}. Source text and media are editable. Its layout has not been reconstructed.`,
      meta:{title:page.seo?.title,description:page.seo?.description,noindex:true},
      blocks:[{_key:key(page.id),_type:'richTextBlock',richText}]};
  });
}

// Webflow exposes the same image through its S3 and CDN hosts. Only alias a
// resized URL when the complete original URL is present in this snapshot.
export function mediaAliases(snapshot) {
  const urls = new Set();
  const scan = (value) => {
    if (typeof value === 'string') for (const match of value.matchAll(/https:\/\/[^\s"'<>]+/g)) {
      try { const url = mediaUrl(match[0].replace(/&amp;/g,'&')); if (url) urls.add(url); } catch { /* Not an asset URL. */ }
    }
    else if (value && typeof value === 'object') Object.values(value).forEach(scan);
  };
  scan(snapshot);
  const assetPath = (url) => new URL(url).pathname.replace(/^\/webflow-prod-assets\//,'/');
  const originals = new Map();
  for (const url of urls) if (!/-p-\d+\.[^/]+$/.test(new URL(url).pathname)) {
    const pathname = assetPath(url);
    if (!originals.has(pathname) || new URL(url).hostname.endsWith('website-files.com')) originals.set(pathname,url);
  }
  const aliases = new Map();
  for (const url of urls) {
    const target = originals.get(assetPath(url).replace(/-p-\d+(\.[^/.]+)$/,'$1'));
    if (target && target !== url) aliases.set(url,target);
  }
  return aliases;
}
