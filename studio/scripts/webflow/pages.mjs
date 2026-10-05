import { documentId, key, reference, htmlDocument, text, mediaUrl, destination, customUrl, plainBlocks, portableText } from './html.mjs';
import { mappings, program } from './collections.mjs';
import { iconFromSvg, mapSourceSections, sectionAnchors, selectedTestimonials, tagline } from './sections.mjs';

const patterns = {
  section_header33: 'videoHero', section_header83: 'videoZoomGrid', section_layout515: 'scrollPanels',
  section_testimonials_testimonial11: 'quoteWall', section_transportation_contact14: 'busMap', section_layout412: 'imageReveal',
  section_blog7: 'latestArticles', section_layout355: 'directorIntro', header50_wrap: 'innerHero', header11o_wrap: 'innerHero', header50c_wrap: 'innerHero',
  'section_summer-camp_programs': 'programCards', 'section_summer-camp_additional-programs': 'programCards',
  'section_summer-camp_club-day-electives': 'electiveCards', section_layout302: 'storyFeature', section_layout30: 'storyFeature',
  'section_summer-camp_history': 'historyStory', 'section_summer-camp_enrollment-process-timeline': 'stackedTimeline',
  section_faq3: 'faqAccordion', section_comparison8: 'rateTable', 'section_k-9-sessions-table_comparison6': 'rateTable',
  section_pricing19: 'pricingCards', section_header103: 'tabbedHero', section_blog66: 'cardSlider', section_layout248: 'iconCards',
  section_stats14: 'statistics', section_layout59: 'storyFeature', section_layout311: 'iconCards', section_team4: 'teamMembers',
  section_cta13: 'ctaBanner', section_filters5: 'filterableCards', section_layout486: 'instructionSteps', section_cta39: 'ctaBanner',
  section_layout10: 'storyFeature', section_layout203: 'storyFeature', section_gallery1: 'embedSection', section_team14: 'teamMembers',
  section_contact21: 'contactDetailsSection', section_career12: 'jobList', section_timeline11: 'stackedTimeline',
  section_content30: 'richTextBlock',
};

export const pageId = (path) => path === '/' ? 'homePage' : path === '/news' ? 'blogIndex' : `wf-page-${key(path)}`;
const prune = (node, selector) => { const clone = node.cloneNode(true); clone.querySelectorAll(selector).forEach((e) => e.remove()); return clone; };
const headingText = (node) => text(node.querySelector('h1,h2,h3,h4,h5,h6'));
export function contentStrings(value) {
  if (typeof value === 'string') return [value.replace(/\s+/g, ' ').trim()];
  if (!value || typeof value !== 'object') return [];
  const strings = value._type === 'block' ? [value.children.map((span) => span.text ?? '').join('').replace(/\s+/g, ' ').trim()] : [];
  for (const [name, child] of Object.entries(value)) if (!name.startsWith('_')) strings.push(...contentStrings(child));
  return strings;
}
export function staticTextNodes(node) {
  if(node.nodeType===3) {
    const value=node.nodeValue.replace(/\s+/g,' ').trim();
    return value?[value]:[];
  }
  return [...node.childNodes].flatMap(staticTextNodes);
}
const imageNodes = (node) => [...node.querySelectorAll('img[src]')];
const firstImage = (node, context) => {
  const image = imageNodes(node).find((e) => mediaUrl(e.getAttribute('src')));
  return image ? context.asset(image.getAttribute('src'), 'image', image.getAttribute('alt') ?? '') : undefined;
};

const ACCENTS = ['green', 'blue', 'red', 'purple', 'mint', 'yellow'];

// The singleton owns one ordered card list per tab. A card in both seasons
// appears in both lists. Hidden and unpublished source cards are not imported.
export function parentDashboard(snapshot, context, main, meta) {
  const header = main.querySelector('.section_layout398 .text-align-center') ?? main;
  const [intro, prompt] = header.querySelectorAll('p');
  const collection = snapshot.collections.find((c) => c.displayName === 'Parent Dashboard Cards');
  const seasons = snapshot.collections.find((c) => c.displayName === 'Seasons');
  const programs = new Map((seasons?.live ?? []).map((item) => [item.id, program(item.fieldData.name)]));
  // The public link each card shows, matched by its exact heading.
  const shown = new Map([...main.querySelectorAll('.w-dyn-item')].flatMap((node) => {
    const anchor = node.querySelector('a[href]:not(.w-condition-invisible)');
    return anchor ? [[text(node.querySelector('h3')), anchor.getAttribute('href')]] : [];
  }));
  const cards = { schoolYear: [], summerCamp: [] };
  const items = (collection?.live ?? []).filter((item) => item.fieldData.live !== false)
    .sort((a, b) => (a.fieldData.order ?? Infinity) - (b.fieldData.order ?? Infinity) || a.fieldData.name.localeCompare(b.fieldData.name));
  for (const item of items) {
    const source = item.fieldData;
    const title = source.name.trim();
    const file = source['use-attachment'] && source.attachment?.url;
    const link = source['use-link'] && source['link-url'];
    let target;
    if (file && link) {
      if (!shown.get(title)) throw new Error('Dashboard has conflicting destination modes without a rendered link');
      target = destination(shown.get(title), context);
    } else if (file) target = { _type: 'contentDestination', kind: 'file', file: context.asset(source.attachment, 'file') };
    else if (link) target = destination(link, context);
    const accent = ACCENTS.find((name) => name === source['color-theme']?.trim().toLowerCase());
    const icon = source['show-icon'] && source['icon-code'] ? iconFromSvg(htmlDocument(source['icon-code']).querySelector('svg')) : undefined;
    const card = {
      _type: 'dashboardCard', title,
      ...(source['card-text'] ? { text: source['card-text'].trim() } : {}),
      ...(accent ? { accent } : {}),
      ...(icon ? { icon } : {}),
      ...(source['show-image'] && source.image?.url ? { image: context.asset(source.image, 'image') } : {}),
      link: { _type: 'contentAction', label: source['link-text']?.trim() || 'Visit Page', ...(target ? { destination: target } : {}) },
    };
    for (const season of new Set((source.season ?? []).map((id) => programs.get(id)).filter(Boolean))) {
      cards[season].push({ ...card, _key: key(`dashboard-${season}-${item.id}`) });
    }
  }
  return {
    _id: 'parentDashboard', _type: 'parentDashboard',
    ...(tagline(header) ? { tagline: tagline(header) } : {}),
    title: text(header.querySelector('h1,h2')),
    intro: text(intro),
    ...(prompt ? { tabsPrompt: portableText(prompt, context, 'parentDashboard-prompt').filter((entry) => entry._type === 'block') } : {}),
    schoolYearLabel: text(main.querySelector('[data-w-tab="School Year"]')),
    summerCampLabel: text(main.querySelector('[data-w-tab="Summer Camp"]')),
    schoolYearCards: cards.schoolYear,
    summerCampCards: cards.summerCamp,
    meta,
  };
}

export function pageContext(snapshot, context) {
  context.routes = new Map(snapshot.pages.filter((p) => p.status === 200 && !p.path.startsWith('/post/')).map((p) => [p.path, pageId(p.path)]));
  context.routes.set('/parent-dashboard', 'parentDashboard');
  for (const c of snapshot.collections.filter((c) => c.displayName === 'Blog Posts')) {
    for (const item of [...c.staged, ...c.live]) context.routes.set(`/post/${item.fieldData.slug}`, documentId(c.id, item.id));
  }
  context.pageDocuments = new Map(snapshot.pages.filter((p) => p.status === 200).map((p) => [p.path, htmlDocument(p.html)]));
  const jobs = context.pageDocuments.get('/staff-opportunities');
  context.jobApplication = [...(jobs?.querySelectorAll('a[href]') ?? [])].find((a) => /apply/i.test(text(a)))?.getAttribute('href');
  const enrichment=context.pageDocuments.get('/school-year/programs/enrichment-classes');
  const enrichmentPaths=new Set([...(enrichment?.querySelectorAll('main section a[href]')??[])].map((a)=>new URL(a.href).pathname));
  context.programListingGroup = (item) => item.fieldData['program-page'] && enrichmentPaths.has(new URL(item.fieldData['program-page'],'https://www.maplewoodyearround.com').pathname) ? 'enrichment' : 'main';
  return context;
}

function actions(node, context, prefix, selector = 'a[href]') {
  return [...node.querySelectorAll(selector)].filter((a) => text(a) && !a.matches('.breadcrumb-link,.w-tab-link')).map((a, i) => ({
    _key: key(`${prefix}-a${i}`), _type: 'contentAction', label: text(a), destination: destination(a.getAttribute('href'), context),
  })).filter((a) => a.destination);
}
const buttons = (items) => items.map((item) => ({ _key: item._key, _type: 'button', text: item.label, variant: 'default', url: customUrl(item.destination) }));

function cardNodes(node) {
  const candidates = [...node.querySelectorAll('[class*="_card"], [class*="_item"], .w-tab-pane')].filter((n) => n.querySelector('h2,h3,h4,h5,h6') && !n.closest('.w-dyn-list'));
  return candidates.filter((n) => !candidates.some((other) => other !== n && n.contains(other)));
}

function cards(node, context, prefix) {
  return cardNodes(node).map((n, i) => ({
    _key: key(`${prefix}-c${i}`), _type: 'contentCard', title: headingText(n),
    description: text(prune(n, 'script,style,svg')), image: firstImage(n, context),
    body: portableText(prune(n, 'script,style,svg'), context, `${prefix}-c${i}`), actions: actions(n, context, `${prefix}-c${i}`),
  }));
}

function collectionFor(node, snapshot, types) {
  const html = node.innerHTML;
  const headings = [...node.querySelectorAll('.w-dyn-item')].map(headingText);
  const named = (item) => [item.fieldData.name, item.fieldData.activity].some((name) => typeof name === 'string' && headings.includes(name.replace(/\s+/g, ' ').trim()));
  const scored = snapshot.collections.filter((c) => types.includes(mappings[c.displayName]?.[0])).map((c) => {
    const matches = c.live.filter((item) => Object.values(item.fieldData).some((v) => v?.url && html.includes(v.url)) || named(item));
    // A sample schedule shows its time (name) beside its activity heading.
    const detailed = matches.filter((item) => named(item) && [item.fieldData.name, item.fieldData.activity].every((value) => typeof value === 'string' && html.includes(value.trim()))).length;
    return { collection: c, matches, named: matches.filter(named).length, detailed };
  // Collections can share photos and item names, so a tie goes to the one
  // whose displayed items show more of each record's own text.
  }).sort((a, b) => b.matches.length - a.matches.length || b.named - a.named || b.detailed - a.detailed);
  return scored[0]?.matches.length ? scored[0] : undefined;
}

// A list of one activity category can also be limited to the camp groups of
// one grade. Choose that grade only when it reproduces the displayed list,
// preferring the grade named in the section's label.
function activityFilters(node, snapshot, found) {
  const field = found.collection.fields.find((f) => f.slug === 'category');
  const categories = new Set(found.matches.map((item) => item.fieldData.category));
  if (categories.size !== 1 || !found.matches.every((item) => item.fieldData.category) || !field?.validations?.collectionId) return {};
  const [category] = categories;
  const filter = { activityCategory: reference(documentId(field.validations.collectionId, category)) };
  const pool = found.collection.live.filter((item) => item.fieldData.category === category && item.fieldData.published !== false);
  const shown = new Set(found.matches.map((item) => item.id));
  if (pool.length === shown.size && pool.every((item) => shown.has(item.id))) return filter;
  const groups = snapshot.collections.find((c) => c.displayName === 'SC Groups');
  const grades = snapshot.collections.find((c) => c.displayName === 'SC Grades');
  const gradesOf = (item) => new Set((item.fieldData['sc-groups-ages'] ?? []).flatMap((id) => groups?.live.find((group) => group.id === id)?.fieldData['entering-grade-2'] ?? []));
  const exact = (grades?.live ?? []).filter((grade) => {
    const listed = pool.filter((item) => gradesOf(item).has(grade.id));
    return listed.length === shown.size && listed.every((item) => shown.has(item.id));
  });
  const label = text(node.querySelector('.text-style-tagline'));
  const grade = exact.find((item) => label.includes(item.fieldData.name.trim())) ?? exact[0];
  return grade ? { ...filter, grade: reference(documentId(grades.id, grade.id)) } : filter;
}

// A School Year list can show the activities of one program, such as a
// class's activities or the birthday add-ons. Use the program whose
// activities, within the location filter, are exactly the displayed list.
function programFilter(node, found, filter) {
  const field = found.collection.fields.find((f) => f.slug === 'programs');
  if (!field?.validations?.collectionId) return {};
  const location = found.collection.fields.find((f) => f.slug === 'indoor-outdoor-special');
  const inLocation = (item) => !filter.location || location?.validations?.options?.find((o) => o.id === item.fieldData['indoor-outdoor-special'])?.name === filter.location;
  const pool = found.collection.live.filter((item) => item.fieldData.live !== false && inLocation(item));
  // Compare names: a hidden record can share a displayed name.
  const shown = [...node.querySelectorAll('.w-dyn-item')].map(headingText);
  const same = (items) => items.length === shown.length && items.every((item) => shown.includes(item.fieldData.name.replace(/\s+/g, ' ').trim()));
  if (same(pool)) return {};
  const programs = [...new Set(found.matches.flatMap((item) => item.fieldData.programs ?? []))];
  const exact = programs.filter((id) => same(pool.filter((item) => (item.fieldData.programs ?? []).includes(id))));
  return exact.length === 1 ? { programOffering: reference(documentId(field.validations.collectionId, exact[0])) } : {};
}

function inferFilter(node, snapshot, allowedTypes) {
  const found = collectionFor(node, snapshot, allowedTypes);
  if (!found) return {};
  const [source, program] = mappings[found.collection.displayName];
  const filter = { source, ...(program ? { program } : {}) };
  // Filter only when every displayed item shares a source value. Do not use a
  // rendered item count as a list limit or copy selected items into the page.
  for (const [sourceField, target] of [['indoor-outdoor', 'location'], ['indoor-outdoor-special', 'location'], ['program', 'audience']]) {
    const values = new Set(found.matches.map((item) => item.fieldData[sourceField]).filter(Boolean));
    const field = found.collection.fields.find((f) => f.slug === sourceField);
    if (values.size === 1 && found.matches.every((item) => item.fieldData[sourceField])) {
      filter[target] = field?.validations?.options?.find((o) => o.id === [...values][0])?.name;
    } else if (values.size > 1) {
      // Several groups share item names (such as "Lunch"). Use the one group
      // whose whole list is exactly the displayed list.
      const shown = node.querySelectorAll('.w-dyn-item').length;
      const fits = [...values].filter((value) => {
        const items = found.collection.live.filter((item) => item.fieldData[sourceField] === value);
        const ids = new Set(found.matches.map((match) => match.id));
        return items.length === shown && items.every((item) => ids.has(item.id));
      });
      if (fits.length === 1) filter[target] = field?.validations?.options?.find((o) => o.id === fits[0])?.name;
    }
  }
  if (source === 'activity') Object.assign(filter, activityFilters(node, snapshot, found), programFilter(node, found, filter));
  if (source === 'facility') {
    const field = found.collection.fields.find((f) => ['category', 'category-multi'].includes(f.slug));
    const shared = found.matches.reduce((ids, item) => ids.filter((id) => item.fieldData[field.slug]?.includes(id)), found.matches[0].fieldData[field.slug] ?? []);
    if (shared.length === 1) filter.facilityCategory = reference(documentId(field.validations.collectionId, shared[0]));
  }
  return filter;
}

function embed(node) {
  const iframe = node.querySelector('iframe[src]');
  const cognito = node.querySelector('script[src*="cognitoforms.com"]');
  const calendar = node.querySelector('script[src*="elfsight"],script[src*="events"]');
  if (cognito) {
    const accountId = cognito.getAttribute('data-key');
    const providerId = cognito.getAttribute('data-form');
    const sentFrom = node.textContent.match(/Cognito\.prefill\(\s*\{\s*"SentFrom"\s*:\s*"([^"]+)"/)?.[1];
    return { provider: 'Cognito', embedUrl: cognito.src, accountId, providerId, sentFrom, frameTitle: 'Schedule a tour' };
  }
  if (calendar) return { provider: 'Events Calendar', embedUrl: calendar.src, providerId: node.querySelector('[data-project-id]')?.getAttribute('data-project-id'), frameTitle: 'Maplewood calendar' };
  if (iframe) return { provider: iframe.src.includes('airtable') ? 'Airtable' : iframe.src.includes('snazzymaps') ? 'Map' : 'Other', embedUrl: iframe.src, frameTitle: iframe.getAttribute('title') || headingText(node) || 'Maplewood form' };
  return {};
}

export function staticPages(snapshot, context, schema) {
  const documents = [], coverage = [], gaps = [];
  const types = new Map(schema.map((entry) => [entry.name, entry.value ?? entry]));
  const typeOf = (type, field) => types.get(type)?.attributes?.[field]?.value;
  for (const page of snapshot.pages.filter((p) => p.status === 200 && !p.path.startsWith('/post/'))) {
    const dom = context.pageDocuments.get(page.path);
    const main = dom.querySelector('main');
    if (!main) throw new Error(`Missing main content on ${page.path}`);
    // Most sections are <section>; the /history timeline is a section_ <div>.
    const sectionNodes = [...main.querySelectorAll('section,header,.w-embed.w-iframe,div[class*="section_"]')].filter((n) => !n.parentElement?.closest('main section,main header,.w-embed.w-iframe,main div[class*="section_"]'));
    const blocks = [];
    const anchors = sectionAnchors(sectionNodes);
    for (const [index, original] of sectionNodes.entries()) {
      const prefix = `${page.path}-${index}`;
      const selector = [...original.classList].find((name) => patterns[name]);
      let type = patterns[selector] ?? (original.matches('.w-embed.w-iframe') ? 'embedSection' : undefined);
      // The parentDashboard singleton imports this section (parentDashboard below).
      if (original.classList.contains('section_layout398')) continue;
      const staticNode = prune(original, '.w-dyn-list,script,style,svg,noscript');
      // Hidden source filter links are not part of the home page's interface.
      if (page.path === '/') staticNode.querySelectorAll('.u-display-hidden').forEach((node) => node.remove());
      if (!type && !text(staticNode) && !staticNode.querySelector('img,iframe,video')) continue;
      if (!type) throw new Error(`Unknown static section pattern on ${page.path} section ${index + 1}`);
      // The /contact registration lists are authored link cards, not a collection.
      if (type === 'cardSlider' && original.querySelector('.contact24_grid-list')) type = 'registrationCards';
      // A story beside staff portraits invites families to tour with them.
      if (type === 'storyFeature' && original.querySelector('.w-dyn-list .team4_image-wrapper')) type = 'teamMembers';
      if (type === 'rateTable' && !original.querySelector('.comparison6_top-row,.comparison8_top-row,table')) type = 'richTextBlock';
      if (type === 'richTextBlock' && /summer-group-schedules|summer-camp-welcome-letters/.test(page.path)) {
        type = 'summerDocumentList';
        // Grade labels are imported as Summer documents headings, not page copy.
        staticNode.querySelectorAll('.content30_content > div:not([class])').forEach((node) => node.remove());
      } else if (type === 'richTextBlock' && original.querySelector('iframe,script[src*="cognitoforms"]')) type = 'embedSection';
      const rawText = text(staticNode);
      const title = headingText(staticNode);
      const block = { _type: type, _key: original.id ? `${original.id}-${index}` : key(prefix) };
      if (typeOf(type, 'background')) block.background = original.className.includes('dark') ? 'green' : 'white';
      const rich = portableText(staticNode, context, prefix);
      const textual = rich.filter((entry) => entry._type === 'block');
      const bodyField = ['richText', 'body', 'notes', 'intro', 'description', 'subtitle'].find((field) => typeOf(type, field));
      if (bodyField) block[bodyField] = typeOf(type, bodyField).type === 'array' || typeOf(type, bodyField).name === 'richTextContent' ? (typeOf(type, bodyField).name === 'richTextContent' ? rich : textual) : rawText;
      const titleField = typeOf(type, 'title') ? 'title' : typeOf(type, 'heading') ? 'heading' : undefined;
      if (titleField && title) block[titleField] = typeOf(type, titleField).type === 'array' || typeOf(type, titleField).name === 'minimalRichText' ? plainBlocks(title, `${prefix}-title`) : title;
      const links = actions(staticNode, context, prefix);
      if (typeOf(type, 'actions')) block.actions = links;
      if (typeOf(type, 'buttons')) block.buttons = buttons(actions(staticNode, context, prefix, 'a.button[href]'));
      if (typeOf(type, 'image')) block.image = firstImage(staticNode, context);
      if (typeOf(type, 'cards')) block.cards = cards(staticNode, context, prefix);
      if (['videoHero', 'videoZoomGrid', 'directorIntro'].includes(type) || (type === 'innerHero' && original.querySelector('video'))) {
        const video = original.querySelector('video');
        const bg = original.querySelector('[data-poster-url]');
        for (const source of video?.querySelectorAll('source[src]') ?? []) {
          if (/\.mp4(?:\?|$)/i.test(source.src)) block.videoMp4 = context.asset(source.src, 'file');
          if (/\.webm(?:\?|$)/i.test(source.src)) block.videoWebm = context.asset(source.src, 'file');
        }
        const poster = video?.getAttribute('poster') || bg?.getAttribute('data-poster-url');
        if (poster) block.poster = context.asset(poster, 'image');
        if (type === 'videoZoomGrid') {
          const images = [...staticNode.querySelectorAll('.header83_image')];
          const mapped = (image, i) => ({ ...context.asset(image.src, 'image', image.alt), _key: key(`${prefix}-i${i}`) });
          block.gridImages = images.map(mapped);
          block.mobileImages = images.filter((image) => !image.parentElement.classList.contains('hide-mobile-landscape')).map(mapped);
        }
      }
      // A calendar list shows dated days with their guest and character; its
      // heading also lists the calendar PDFs, which the Website adds itself.
      if (type === 'cardSlider' && original.querySelector('.event19_meta-wrapper')) Object.assign(block, { source: 'playgroundEvent' });
      else if (['cardSlider', 'filterableCards'].includes(type)) {
        Object.assign(block, inferFilter(original, snapshot, ['activity', 'facility', 'sampleSchedule', 'playgroundCharacter', 'playgroundGuest', 'playgroundEvent', 'playgroundCalendar']));
        if (page.path === '/school-year/facilities') Object.assign(block, { source: 'facility', program: 'schoolYear' });
        if (!block.source) gaps.push({ path: page.path, section: index + 1, reason: 'collection source not resolved' });
      }
      if (['programCards', 'teamMembers', 'quoteWall', 'faqAccordion', 'jobList'].includes(type)) {
        const inferred = inferFilter(original, snapshot, [{programCards:'programOffering',teamMembers:'staffMember',quoteWall:'testimonial',faqAccordion:'faq',jobList:'jobOpportunity'}[type]]);
        if (inferred.program) block.program = inferred.program;
        else if (page.path.startsWith('/summer-camp')) block.program = 'summerCamp';
        else if (page.path.startsWith('/school-year')) block.program = 'schoolYear';
        else if (type === 'faqAccordion' && original.id === 'summer-camp') block.program = 'summerCamp';
        else if (type === 'faqAccordion' && original.id === 'school-year') block.program = 'schoolYear';
      }
      if (type === 'teamMembers') { block.profileGroup = selector === 'section_team14' ? 'leadership' : 'roster'; block.presentation = block.profileGroup === 'leadership' ? 'profiles' : selector === 'section_team4' ? 'roster' : 'tour'; }
      if (type === 'programCards') block.listingGroup = selector?.includes('additional') ? 'additional' : page.path.includes('enrichment') ? 'enrichment' : page.path === '/maplewood-seasons' ? 'seasons' : 'main';
      if (type === 'summerDocumentList') { block.documents = reference('wf-summer-documents-2026'); block.kind = page.path.includes('welcome') ? 'welcomeLetter' : 'schedule'; }
      if (type === 'embedSection') Object.assign(block, embed(original));
      if (type === 'busMap') block.embedUrl = embed(original).embedUrl;
      if (type === 'rateTable') {
        const header = original.querySelector('.comparison6_top-row,.comparison8_top-row,thead tr');
        const rows = [...original.querySelectorAll('.comparison6_row,.comparison8_row,tbody tr')];
        block.columns = [...header.children].map(text);
        block.rows = rows.map((row, i) => ({ _key: key(`${prefix}-r${i}`), _type: 'rateRow', label: text(row.firstElementChild), cells: [...row.children].slice(1).map(text) }));
      }
      if (type === 'pricingCards') block.plans = cards(staticNode, context, prefix).map((card) => ({ _key: card._key, _type: 'pricingPlan', title: card.title, details: card.body, actions: card.actions }));
      if (type === 'stackedTimeline') block.items = cards(staticNode, context, prefix).map((card) => ({ _key: card._key, _type: 'stackedTimelineItem', title: card.title, text: card.description, image: card.image }));
      if (type === 'featureCards') block.groups = [{ _key: key(prefix), _type: 'featureCardGroup', heading: title, cards: cards(staticNode, context, prefix).map((card) => ({ _key: card._key, _type: 'featureCardItem', title: card.title, text: card.description, image: card.image, ...(card.actions[0] ? { link: { text: card.actions[0].label, url: customUrl(card.actions[0].destination) } } : {}) })) }];
      if (type === 'statistics') block.items = [...original.querySelectorAll('[class*="stats14"][class*="item"]')].map((node, i) => ({ _key: key(`${prefix}-s${i}`), _type: 'statistic', value: text(node.firstElementChild), label: text(node.lastElementChild) }));
      if (page.path !== '/') mapSourceSections({ type, selector, original, staticNode, block, context, prefix, snapshot, anchors, html: page.html });
      // The zoom grid and bus map have the same slots on every page.
      if (page.path === '/' || ['videoZoomGrid', 'busMap'].includes(type)) {
        // The home composition has distinct intro, label, body and action slots.
        // Preserve those slots on every import, including the final frozen run.
        const paragraphs = (node) => {
          const wrapper = node.ownerDocument.createElement('div');
          node.querySelectorAll('p').forEach((paragraph) => wrapper.append(paragraph.cloneNode(true)));
          return wrapper;
        };
        if (['videoHero', 'videoZoomGrid', 'busMap', 'imageReveal', 'latestArticles'].includes(type)) {
          block.description = text(staticNode.querySelector('p'));
          const label = text(staticNode.querySelector('.text-style-tagline'));
          if (label && typeOf(type, 'eyebrow')) block.eyebrow = label;
          if (typeOf(type, 'actions')) block.actions = actions(staticNode, context, prefix, '.button[href]');
        }
        if (['videoHero', 'videoZoomGrid'].includes(type)) {
          if (type === 'videoZoomGrid' && tagline(staticNode)) block.tagline = tagline(staticNode);
          const heading = staticNode.querySelector('h1,h2');
          block.highlightText = text(heading?.querySelector('.text-color-brand-secondary'));
          const copy = heading?.cloneNode(true);
          copy?.querySelectorAll('br').forEach((node) => node.replaceWith(' '));
          block.title = [...(copy?.childNodes ?? [])].map(text).filter(Boolean).join(' ');
        }
        if (type === 'scrollPanels') {
          const desktopImages = [...staticNode.querySelectorAll('.layout515_content-right img')];
          block.cards = [...staticNode.querySelectorAll('.layout515_item')].map((node, i) => ({
            _key: key(`${prefix}-c${i}`), _type: 'contentCard',
            title: headingText(node), eyebrow: text(node.querySelector('.text-style-tagline')),
            body: portableText(paragraphs(node), context, `${prefix}-c${i}`),
            image: desktopImages[i] ? context.asset(desktopImages[i].src, 'image', desktopImages[i].alt) : firstImage(node, context),
            mobileImage: firstImage(node, context),
            actions: actions(node, context, `${prefix}-c${i}`, '.button[href]'),
          }));
          delete block.description;
        }
        if (type === 'quoteWall') {
          // This source photo is declared in Webflow's stylesheet, not its HTML.
          block.backgroundImage = context.asset('https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67a5d0a3369797b17dbfc98b_summer-camp-maplewood-wow-testimonies-1.avif', 'image');
          block.selectedTestimonials = selectedTestimonials(original, snapshot);
          if (!block.selectedTestimonials) throw new Error('A home testimonial has no live source record');
          const captions = [...original.querySelectorAll('.wall-of-love_item')].map((node) => text(node).slice(-40));
          if (captions.length && captions.every((caption) => caption.endsWith('Summer Camp'))) block.program = 'summerCamp';
          const closing = staticNode.cloneNode(true);
          closing.querySelectorAll('h1,h2,h3').forEach((node) => node.remove());
          block.description = text(closing);
        }
        if (type === 'busMap') block.cards = block.cards.map((card) => ({ ...card, description: card.title && card.description.startsWith(card.title) ? card.description.slice(card.title.length).trim() : card.description }));
        if (type === 'imageReveal') {
          block.body = portableText(paragraphs(staticNode), context, prefix);
          block.highlightText = text(staticNode.querySelector('h2 .text-color-brand-secondary'));
        }
        if (type === 'latestArticles') {
          const posts = snapshot.collections.find((collection) => collection.displayName === 'Blog Posts');
          const names = [...original.querySelectorAll('.blog7_featured-item h2,.blog7_item h2')].map(text);
          block.selectedPosts = names.map((name) => {
            const item = posts.live.find((item) => item.fieldData.name.trim() === name);
            if (!item) throw new Error('A home news item has no live source record');
            return { ...reference(documentId(posts.id, item.id)), _key: key(item.id) };
          });
          block.featuredFirst = true;
          block.limit = 4;
        }
      }
      // Every remaining static text node must be present in an editable field.
      // An unsupported fit is reported, never hidden in an opaque source blob.
      const strings = contentStrings(block);
      // Separators such as "•" and the dash after a label badge are drawn by
      // the Website, so they are not editor copy.
      const leaves = staticTextNodes(staticNode).map((value) => value.replace(/\u200d/g, '').replace(/^[–•·]\s*/, '')).filter(Boolean);
      const missing = leaves.filter((value) => !strings.some((stored) => stored.includes(value)));
      if (missing.length) gaps.push({ path: page.path, section: index + 1, reason: 'static copy does not fit section fields', missing });
      coverage.push({ path: page.path, section: index + 1, type, textNodes: leaves.length, covered: leaves.length - missing.length });
      blocks.push(block);
    }
    const metaDescription = dom.querySelector('meta[name="description"]')?.content;
    const metadata = { title: dom.title, description: metaDescription };
    const shareImage = dom.querySelector('meta[property="og:image"]')?.content;
    if (shareImage && mediaUrl(shareImage)) metadata.image = context.asset(shareImage, 'image');
    if (page.path === '/parent-dashboard') documents.push(parentDashboard(snapshot, context, main, metadata)); else documents.push({ _id: pageId(page.path), _type: page.path === '/' ? 'homePage' : page.path === '/news' ? 'blogIndex' : 'page', title: headingText(main) || dom.title, ...(page.path !== '/' && page.path !== '/news' ? { slug: { _type:'slug', current:page.path.slice(1) } } : {}), description:metaDescription, meta:metadata, blocks });
  }
  return { documents, coverage, gaps };
}
