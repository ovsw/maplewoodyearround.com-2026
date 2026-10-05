import { key, text, destination, customUrl, plainBlocks, portableText, reference, documentId } from './html.mjs';

// Source slots of the shared inner-page sections. These run on every page
// except home, so each mapping depends on the source component, never a path.

const ACCENTS = new Set(['blue', 'red', 'purple', 'mint', 'yellow']);
const PROGRAM_CLASSES = { 'summer-camp': 'summerCamp', 'school-year': 'schoolYear' };

// Section backgrounds from the live stylesheet's rule order and specificity.
// Unlisted components keep the importer's generic choice.
const BACKGROUNDS = {
  section_layout10: 'cream', section_layout203: 'white', section_layout30: 'white',
  section_comparison8: 'cream', 'section_k-9-sessions-table_comparison6': 'white',
  section_pricing19: 'white', section_faq3: 'white', section_blog66: 'cream',
  section_layout486: 'white', section_cta39: 'white', section_team4: 'white',
  section_content30: 'white', section_gallery1: 'white',
};

// Most source pages carry custom code that alternates <section> backgrounds:
// odd sections show the cream page, even ones are white, dark ones keep theirs.
const ALTERNATING = /main section:nth-of-type\(odd\)/;

function backgroundOf(selector, node, html) {
  if (ALTERNATING.test(html) && node.tagName === 'SECTION' && node.getAttribute('data-theme') !== 'dark') {
    let position = 1;
    for (let sibling = node.previousElementSibling; sibling; sibling = sibling.previousElementSibling) if (sibling.tagName === 'SECTION') position += 1;
    return position % 2 ? 'cream' : 'white';
  }
  if (selector === 'section_faq3') return node.classList.contains('alt') ? 'cream' : 'white';
  if (selector === 'section_blog66' && node.classList.contains('background-color-white')) return 'white';
  return BACKGROUNDS[selector];
}

// Icon artwork must pass the Website's SVG allowlist. Keep drawing elements
// and presentation attributes; drop everything else rather than escape it.
const ICON_TAGS = new Set(['svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse']);
const ICON_ATTRIBUTES = new Set(['xmlns', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'opacity', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points', 'transform']);
const ATTRIBUTE_VALUE = /^[^"<>]*$/;

export function iconFromSvg(svg) {
  if (!svg) return undefined;
  const serialize = (node) => {
    const tag = node.tagName.toLowerCase();
    if (!ICON_TAGS.has(tag)) return '';
    const attributes = [...node.attributes]
      .filter((attribute) => ICON_ATTRIBUTES.has(attribute.name) && ATTRIBUTE_VALUE.test(attribute.value))
      .map((attribute) => ` ${attribute.name}="${attribute.value}"`).join('');
    return `<${tag}${attributes}>${[...node.children].map(serialize).join('')}</${tag}>`;
  };
  const markup = serialize(svg);
  return markup.startsWith('<svg') ? { _type: 'icon', svg: markup } : undefined;
}

const programOf = (node) => Object.entries(PROGRAM_CLASSES).find(([name]) => node?.classList?.contains(name))?.[1];
const accentOf = (node) => {
  const theme = node?.closest('[data-wf--pricing-card--style-color-theme]')?.getAttribute('data-wf--pricing-card--style-color-theme');
  const value = theme ?? [...(node?.closest('[class*="u-accent-"]')?.classList ?? [])].find((name) => name.startsWith('u-accent-'))?.slice(9);
  return ACCENTS.has(value) ? value : undefined;
};

// With two accent classes, the later one wins in the live stylesheet.
const lastAccent = (node) => {
  const value = [...(node?.closest('[class*="u-accent-"]')?.classList ?? [])].filter((name) => name.startsWith('u-accent-')).at(-1)?.slice(9);
  return ACCENTS.has(value) ? value : undefined;
};

// A Webflow lightbox lists its media in a JSON script; keep a YouTube link only.
function lightboxVideo(lightbox) {
  try {
    const url = new URL(JSON.parse(lightbox.querySelector('script.w-json')?.textContent ?? '{}').items?.[0]?.url);
    return url.protocol === 'https:' && /(^|\.)(youtube\.com|youtu\.be)$/.test(url.hostname) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

// Icons coloured with a brand text colour instead of a u-accent class.
const ICON_COLOURS = { 'text-color-brand-quarternary': 'purple', 'text-color-brand-accent-dark': 'blue', 'text-color-brand-secondary-mid': 'yellow' };
const iconAccent = (node) => Object.entries(ICON_COLOURS).find(([name]) => node?.querySelector(`.${name}`))?.[1];

export function tagline(node) {
  const label = node.querySelector('.text-style-tagline');
  if (!label) return undefined;
  if (programOf(label)) return { _type: 'tagline', label: text(label), program: programOf(label) };
  const badge = [...label.querySelectorAll('*')].find(programOf);
  const rest = text(label).slice(badge ? text(badge).length : 0).replace(/^\s*[–-]\s*/, '').trim();
  return { _type: 'tagline', ...(badge ? { label: text(badge), program: programOf(badge) } : {}), ...(rest ? { text: rest } : {}) };
}

const buttonVariant = (a) => a.classList.contains('is-link') ? 'link' : a.classList.contains('is-secondary') ? 'outline' : 'default';

// Buttons keep their label without a destination, so an editor can add the
// missing link. The Website hides a button until it has a destination.
export function sourceButtons(nodes, context, prefix) {
  return nodes.filter((a) => text(a)).map((a, i) => {
    const target = destination(a.getAttribute('href'), context);
    return { _key: key(`${prefix}-b${i}`), _type: 'button', text: text(a), variant: buttonVariant(a), ...(target ? { url: { ...customUrl(target), openInNewTab: a.target === '_blank' } } : {}) };
  });
}

export function sourceActions(nodes, context, prefix) {
  return nodes.filter((a) => text(a)).map((a, i) => {
    const target = destination(a.getAttribute('href'), context);
    return { _key: key(`${prefix}-a${i}`), _type: 'contentAction', label: text(a), ...(target ? { destination: { ...target, openInNewTab: a.target === '_blank' } } : {}) };
  });
}

const without = (node, selector) => {
  const clone = node.cloneNode(true);
  clone.querySelectorAll(selector).forEach((child) => child.remove());
  return clone;
};
const headingOf = (node) => node.querySelector('h1,h2,h3');
// Plain text that keeps the source's line breaks.
const lines = (node) => {
  const clone = node.cloneNode(true);
  clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  return clone.textContent.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
};
// Elements with a class that ends in the given Webflow component suffix.
const bySuffix = (node, suffix) => [...node.querySelectorAll(`[class*="${suffix}"]`)].filter((element) => [...element.classList].some((name) => name.endsWith(suffix)));
const buttonLinks = (node) => [...node.querySelectorAll('a.button, .button-group a')];
// Remove the section heading only; headings inside the copy stay.
const withoutTitle = (node, title, selector) => {
  title?.setAttribute('data-import-title', '');
  const copy = without(node, `${selector},[data-import-title]`);
  title?.removeAttribute('data-import-title');
  return copy;
};
const textBlocks = (node, context, prefix) => portableText(node, context, prefix).filter((entry) => entry._type === 'block');
// Parts of a copy that are not editor text: labels, headings, actions, media.
const NON_COPY = '.text-style-tagline,.button-group,.button,img,iframe,script,style,svg,noscript,.w-dyn-list';

function featureItems(node, context, prefix) {
  const items = bySuffix(node, '_item-list').flatMap((list) => [...list.children]).filter((item) => item.querySelector('h3,h4,h5,h6'));
  return items.map((item, i) => ({
    _key: key(`${prefix}-f${i}`), _type: 'featureItem',
    ...(iconFromSvg(item.querySelector('svg')) ? { icon: iconFromSvg(item.querySelector('svg')) } : {}),
    ...(accentOf(item) ? { accent: accentOf(item) } : {}),
    title: text(item.querySelector('h3,h4,h5,h6')),
    body: textBlocks(without(item, 'h3,h4,h5,h6,svg'), context, `${prefix}-f${i}`),
  }));
}

function rateColumn(node, context, prefix, i) {
  const heading = node.querySelector('[class*="heading-style-h6"]');
  const note = heading?.querySelector('.text-size-small');
  const image = node.querySelector('img');
  const label = (text(note ? without(heading, '.text-size-small') : heading) || text(node)).replace(/\u200d/g, '');
  return {
    _key: key(`${prefix}-col${i}`), _type: 'rateColumn', label,
    ...(note ? { note: text(note) } : {}),
    ...(text(node.querySelector('.opacity-80')) ? { detail: text(node.querySelector('.opacity-80')) } : {}),
    ...(image ? { image: context.asset(image.getAttribute('src'), 'image', image.getAttribute('alt') ?? '') } : {}),
  };
}

// The FAQ list on a page is a filtered CMS list. Use the one category that
// every displayed question shares; do not copy the questions into the page.
function faqCategory(original, snapshot) {
  const faqs = snapshot.collections.find((collection) => collection.displayName === 'FAQs');
  const shown = [...original.querySelectorAll('.w-dyn-item')].map((node) => text(node.querySelector('[class*="question"]')));
  const items = shown.map((question) => faqs?.live.find((item) => item.fieldData.name.trim() === question)).filter(Boolean);
  if (!items.length || items.length !== shown.length) return undefined;
  const field = faqs.fields.find((f) => f.slug === 'category');
  const values = items.map((item) => [item.fieldData.category].flat().filter(Boolean));
  const shared = values.reduce((ids, list) => ids.filter((id) => list.includes(id)), values[0]);
  // Several categories can contain every shown question. Choose the one
  // whose whole live membership is exactly the displayed list.
  const exact = shared.filter((id) => faqs.live.filter((item) => [item.fieldData.category].flat().includes(id)).length === items.length);
  return exact.length === 1 && field?.validations?.collectionId ? reference(documentId(field.validations.collectionId, exact[0])) : undefined;
}

// The displayed testimonials as references, or nothing if one has no record.
export function selectedTestimonials(original, snapshot) {
  const source = snapshot.collections?.find((collection) => collection.displayName === 'Testimonials');
  const normalized = (value) => (typeof value === 'string' ? value : '').replace(/\s+/g, ' ').trim();
  // A short quote can sit inside a longer displayed one: take the longest
  // unused match so each testimonial is selected once.
  const used = new Set();
  const items = [...original.querySelectorAll('.wall-of-love_item')].map((node) => {
    const content = normalized(text(node));
    const match = (source?.live ?? [])
      .map((item) => ({ item, quote: normalized(item.fieldData['testimonial-text']) }))
      .filter(({ item, quote }) => quote.length > 0 && !used.has(item.id) && content.includes(quote))
      .sort((a, b) => b.quote.length - a.quote.length)[0]?.item;
    if (match) used.add(match.id);
    return match;
  });
  if (!items.length || items.some((item) => !item)) return undefined;
  return items.map((item) => ({ ...reference(documentId(source.id, item.id)), _key: key(item.id) }));
}

function breadcrumbs(node, context, prefix) {
  return [...node.querySelectorAll('.breadcrumb_component a')].filter((a) => text(a)).map((a, i) => {
    const target = destination(a.getAttribute('href'), context);
    return { _key: key(`${prefix}-crumb${i}`), _type: 'breadcrumb', label: text(a), ...(target ? { destination: target } : {}), ...(programOf(a) ? { program: programOf(a) } : {}) };
  });
}

// The words of a heading in the live highlight colour.
const highlightOf = (heading) => text(heading?.querySelector('[class*="text-color-brand-secondary"]'));

export function mapSourceSections({ type, selector, original, staticNode, block, context, prefix, snapshot, anchors, html }) {
  const background = backgroundOf(selector, original, html);
  if (background && 'background' in block) block.background = background;
  if (original.id && anchors.get(original.id) === original) block.anchorId = original.id;
  let title = headingOf(staticNode);

  if (type === 'iconCards') {
    // Heading on the left, introduction on the right, then the cards.
    const left = bySuffix(staticNode, '_content-left')[0] ?? staticNode;
    const right = bySuffix(staticNode, '_content-right')[0];
    block.breadcrumbs = breadcrumbs(left, context, prefix);
    block.tagline = tagline(left);
    block.title = text(headingOf(left));
    block.intro = right ? textBlocks(without(right, `${NON_COPY},[class*="_list"]`), context, prefix) : [];
    block.cards = bySuffix(original, '_item').filter((item) => item.querySelector('h3')).map((item, i) => {
      const heading = item.querySelector('h3');
      const label = item.querySelector('p.text-weight-bold');
      const link = sourceActions(buttonLinks(item), context, `${prefix}-c${i}`)[0];
      return {
        _key: key(`${prefix}-c${i}`), _type: 'iconCard',
        ...(iconFromSvg(item.querySelector('svg')) ? { icon: iconFromSvg(item.querySelector('svg')) } : {}),
        ...(accentOf(item.querySelector('[class*="u-accent-"]') ?? item) ?? iconAccent(item) ? { accent: accentOf(item.querySelector('[class*="u-accent-"]') ?? item) ?? iconAccent(item) } : {}),
        title: lines(heading).replace(/\n/g, ' '),
        ...(label ? { label: text(label) } : {}),
        body: textBlocks(without(item, `${NON_COPY},h3,p.text-weight-bold`), context, `${prefix}-c${i}`),
        ...(link ? { link: { label: link.label, ...(link.destination ? { destination: link.destination } : {}) } } : {}),
      };
    });
    for (const field of ['description', 'groups', 'eyebrow']) delete block[field];
    return;
  }

  if (type === 'tabbedHero') {
    // One tab per Webflow tab pane, named by its tab-menu link.
    const names = new Map([...original.querySelectorAll('.w-tab-menu [data-w-tab]')].map((link) => [link.getAttribute('data-w-tab'), text(link)]));
    block.breadcrumbs = breadcrumbs(staticNode, context, prefix);
    block.tabs = [...staticNode.querySelectorAll('.w-tab-pane')].map((pane, i) => {
      const heading = headingOf(pane);
      const image = pane.querySelector('img');
      return {
        _key: key(`${prefix}-tab${i}`), _type: 'heroTab',
        label: names.get(pane.getAttribute('data-w-tab')) ?? pane.getAttribute('data-w-tab'),
        title: text(heading),
        ...(highlightOf(heading) ? { highlightText: highlightOf(heading) } : {}),
        description: [...pane.querySelectorAll('p')].map(lines).filter(Boolean).join('\n'),
        buttons: sourceButtons(buttonLinks(pane), context, `${prefix}-tab${i}`),
        ...(image ? { image: context.asset(image.getAttribute('src'), 'image', image.getAttribute('alt') ?? '') } : {}),
      };
    });
    for (const field of ['title', 'description', 'cards']) delete block[field];
    return;
  }

  if (type === 'innerHero') {
    const content = staticNode.querySelector('[class*="_content-wrap"]') ?? staticNode;
    block.breadcrumbs = breadcrumbs(content, context, prefix);
    const highlight = highlightOf(content.querySelector('h1'));
    if (highlight) block.highlightText = highlight;
    const group = content.querySelector('.button-group');
    const linksLabel = group?.previousElementSibling;
    if (linksLabel && !linksLabel.querySelector('a') && text(linksLabel)) block.linksLabel = text(linksLabel);
    block.buttons = sourceButtons(group ? buttonLinks(group.parentElement) : [], context, prefix);
    const label = text(content.querySelector('.text-style-tagline'));
    if (label) block.eyebrow = label;
    const copy = without(content, `${NON_COPY},h1,.breadcrumb_component,[class*="button-row"]`);
    block.body = [...copy.querySelectorAll('p')].map(lines).filter(Boolean).join('\n') || lines(copy);
    return;
  }

  if (type === 'storyFeature') {
    if (title && bySuffix(staticNode, '_item-list').some((list) => list.contains(title))) {
      delete block.title;
      title = undefined;
    }
    block.tagline = tagline(staticNode);
    block.headingSize = title?.matches('.heading-style-h4,h3,h4') ? 'small' : 'large';
    const image = staticNode.querySelector('img');
    // A source image placed before the copy renders on the left.
    block.imagePosition = image && title && image.compareDocumentPosition(title) & 4 ? 'left' : 'right';
    block.features = featureItems(original, context, prefix);
    bySuffix(staticNode, '_item-list').forEach((node) => node.setAttribute('data-import-features', ''));
    // A lightbox photo plays a YouTube video; its label sits on the photo.
    const lightbox = original.querySelector('a.w-lightbox');
    const video = lightbox && lightboxVideo(lightbox);
    if (video) {
      block.videoUrl = video;
      const label = lines(without(staticNode.querySelector('.w-lightbox'), 'script')).replace(/\n/g, ' ');
      if (label) block.videoLabel = label;
    }
    block.richText = textBlocks(withoutTitle(staticNode, title, `${NON_COPY},[data-import-features],.w-lightbox`), context, prefix);
    block.buttons = sourceButtons(buttonLinks(staticNode), context, prefix);
    return;
  }

  if (type === 'directorIntro') {
    // Panels in reading order: the left and right columns alternate.
    const column = (suffix) => bySuffix(staticNode, suffix).flatMap((node) => bySuffix(node, '_text-wrapper'));
    const left = column('_content-left');
    const right = column('_content-right');
    const panels = Array.from({ length: Math.max(left.length, right.length) }, (_, i) => [left[i], right[i]]).flat().filter(Boolean);
    block.panels = panels.map((node, i) => ({
      _key: key(`${prefix}-p${i}`), _type: 'directorPanel',
      title: text(headingOf(node)),
      body: textBlocks(without(node, `${NON_COPY},h1,h2,h3`), context, `${prefix}-p${i}`),
    }));
    return;
  }

  if (type === 'jobList') {
    // The jobs are Job Opportunities records; the section keeps its introduction.
    const intro = bySuffix(staticNode, '_content-left')[0] ?? staticNode;
    block.title = text(headingOf(intro));
    block.intro = textBlocks(withoutTitle(intro, headingOf(intro), NON_COPY), context, prefix);
    return;
  }

  if (type === 'contactDetailsSection') {
    block.features = bySuffix(original, '_item').filter((item) => item.querySelector('h3')).map((item, i) => ({
      _key: key(`${prefix}-f${i}`), _type: 'featureItem',
      ...(iconFromSvg(item.querySelector('svg')) ? { icon: iconFromSvg(item.querySelector('svg')) } : {}),
      ...(lastAccent(item.querySelector('[class*="u-accent-"]')) ? { accent: lastAccent(item.querySelector('[class*="u-accent-"]')) } : {}),
      title: text(item.querySelector('h3')),
      body: textBlocks(without(item, `${NON_COPY},h3`), context, `${prefix}-f${i}`),
    }));
    return;
  }

  if (type === 'registrationCards') {
    const heading = bySuffix(staticNode, '_heading-wrapper')[0] ?? staticNode;
    const sourceHeading = bySuffix(original, '_heading-wrapper')[0] ?? original;
    block.tagline = tagline(heading);
    // The heading icon sits beside the heading, in the button group's accent.
    const headingIcon = [...sourceHeading.querySelectorAll('.button-group svg')].find((svg) => !svg.closest('a,.button'));
    if (iconFromSvg(headingIcon)) block.icon = iconFromSvg(headingIcon);
    if (accentOf(headingIcon)) block.accent = accentOf(headingIcon);
    block.title = text(headingOf(heading));
    const intro = heading.querySelector('.w-richtext');
    block.intro = intro ? textBlocks(intro, context, `${prefix}-intro`) : [];
    block.actions = sourceActions(buttonLinks(heading), context, prefix);
    block.cards = bySuffix(original, '_item').filter((item) => item.querySelector('h3')).map((item, i) => {
      const links = [...item.querySelectorAll('a[href]')].filter((a) => text(a).replace(/‍/g, '').trim());
      return {
        _key: key(`${prefix}-c${i}`), _type: 'registrationCard',
        ...(iconFromSvg(item.querySelector('svg')) ? { icon: iconFromSvg(item.querySelector('svg')) } : {}),
        ...(lastAccent(item) ? { accent: lastAccent(item) } : {}),
        title: text(item.querySelector('h3')),
        body: textBlocks(without(item, `${NON_COPY},h3,a,ul`), context, `${prefix}-c${i}`),
        links: sourceActions(links, context, `${prefix}-c${i}`),
      };
    });
    return;
  }

  if (type === 'stackedTimeline' && selector === 'section_timeline11') {
    // Dated milestones on alternating sides of a centred line.
    const intro = staticNode.querySelector('.max-width-large') ?? staticNode;
    block.layout = 'milestones';
    block.eyebrow = text(intro.querySelector('.text-style-tagline'));
    block.intro = [...intro.querySelectorAll('p')].map(lines).filter(Boolean).join('\n');
    block.buttons = [];
    block.items = bySuffix(staticNode, '_item').filter((node) => node.querySelector('h3,h4')).map((node, i) => {
      const image = node.querySelector('img');
      return {
        _key: key(`${prefix}-t${i}`), _type: 'stackedTimelineItem',
        meta: text(node.querySelector('h3')), title: text(node.querySelector('h4')),
        body: textBlocks(without(node, `${NON_COPY},h3,h4`), context, `${prefix}-t${i}`),
        ...(image ? { image: context.asset(image.getAttribute('src'), 'image', image.getAttribute('alt') ?? '') } : {}),
      };
    });
    return;
  }

  // Policy text (content30) keeps every heading in its copy; the first one
  // is not a section heading.
  if (type === 'richTextBlock' && selector === 'section_content30') {
    delete block.title;
    block.richText = portableText(without(staticNode, NON_COPY), context, prefix);
    return;
  }

  if (type === 'richTextBlock' && title) {
    block.tagline = tagline(staticNode);
    block.align = title.closest('.text-align-center') ? 'center' : 'left';
    block.title = text(title);
    block.richText = portableText(withoutTitle(staticNode, title, NON_COPY), context, prefix);
    return;
  }

  if (type === 'rateTable') {
    const top = bySuffix(staticNode, '_top-row')[0];
    // A plain HTML table keeps the importer's generic table mapping.
    if (!top) return;
    // Paragraphs before the table introduce it; those after it close it.
    const paragraphs = [...staticNode.querySelectorAll('p')].filter((p) => !p.closest('[class*="_row"]'));
    const before = paragraphs.filter((p) => p.compareDocumentPosition(top) & 4);
    const after = paragraphs.filter((p) => !before.includes(p));
    const blocksOf = (nodes, suffix) => textBlocks(Object.assign(staticNode.ownerDocument.createElement('div'), { innerHTML: nodes.map((p) => p.outerHTML).join('') }), context, `${prefix}-${suffix}`);
    block.tagline = tagline(staticNode);
    block.intro = blocksOf(before, 'intro');
    block.columns = [...top.children].map((node, i) => rateColumn(node, context, prefix, i));
    // A table whose top row has only the row-heading cell has one unnamed price column.
    const width = Math.max(0, ...block.rows.map((row) => row.cells.length));
    while (block.columns.length < width + 1) block.columns.push({ _key: key(`${prefix}-col${block.columns.length}`), _type: 'rateColumn', label: '' });
    const labels = block.columns.slice(1).map((column) => column.label);
    // Phones show each price with its column heading; the Website adds it.
    for (const node of staticNode.querySelectorAll('[class*="_row"] *')) if (labels.some((label) => text(node).replace(/\u200d/g, '') === `${label}:`)) node.remove();
    block.rows = block.rows.map((row) => ({ ...row, label: row.label.replace(/\u200d/g, '').trim(), cells: row.cells.map((cell, i) => cell.startsWith(`${labels[i]}:`) ? cell.slice(labels[i].length + 1).trim() : cell) }));
    block.notes = blocksOf(after, 'notes');
    block.actions = sourceActions(buttonLinks(staticNode), context, prefix);
    delete block.description;
    return;
  }

  if (type === 'pricingCards') {
    block.tagline = tagline(staticNode);
    const plans = bySuffix(original, '_plan');
    // The introduction keeps its bold words, line breaks and links.
    const intro = without(staticNode, `${NON_COPY},[class*="_grid-list"],[class*="_plan"],.check-list_wrap,h1,h2,h3`);
    block.intro = textBlocks(intro, context, `${prefix}-intro`);
    delete block.description;
    // Checklists, such as what a party includes and what to bring.
    const checklist = (column, i) => {
      const items = [...column.querySelectorAll('.check-list_item')];
      const heading = items.find((item) => !item.querySelector('svg'));
      const listed = items.filter((item) => item.querySelector('svg'));
      return {
        _key: key(`${prefix}-list${i}`), _type: 'checklist',
        ...(heading && items.indexOf(heading) === 0 ? { title: text(heading) } : {}),
        ...(iconFromSvg(listed[0]?.querySelector('svg')) ? { icon: iconFromSvg(listed[0].querySelector('svg')) } : {}),
        ...(accentOf(listed[0]) ? { accent: accentOf(listed[0]) } : {}),
        items: listed.flatMap((item, j) => textBlocks(item, context, `${prefix}-list${i}-${j}`)),
      };
    };
    const columns = [...original.querySelectorAll('.check-list_wrap > [class*="check-list_content"]')];
    block.checklists = columns.map(checklist);
    // An item without an icon after the first is a note under the lists.
    const notes = columns.flatMap((column) => [...column.querySelectorAll('.check-list_item')].filter((item, i) => i > 0 && !item.querySelector('svg')));
    if (notes.length) block.checklistNote = notes.flatMap((item, j) => textBlocks(item, context, `${prefix}-note${j}`));
    block.plans = plans.map((plan, i) => {
      const heading = plan.querySelector('[class*="heading-style-h6"],h3,h4');
      const price = bySuffix(plan, '_card-title')[0];
      // Feature rows become list items; every other line keeps its text.
      const details = without(plan, `${NON_COPY}`);
      details.querySelectorAll('[class*="heading-style-h6"],h3,h4').forEach((node) => node === details.querySelector('[class*="heading-style-h6"],h3,h4') && node.remove());
      bySuffix(details, '_card-title').forEach((node) => node.remove());
      bySuffix(details, '_feature').forEach((node) => { const item = node.ownerDocument.createElement('li'); item.innerHTML = node.innerHTML; node.replaceWith(item); });
      details.querySelectorAll('li').forEach((item) => { if (item.parentElement?.tagName !== 'UL') { const list = item.ownerDocument.createElement('ul'); item.replaceWith(list); list.append(item); } });
      return {
        _key: key(`${prefix}-p${i}`), _type: 'pricingPlan',
        ...(iconFromSvg(plan.querySelector('[class*="_icon-wrapper"] svg')) ? { icon: iconFromSvg(plan.querySelector('[class*="_icon-wrapper"] svg')) } : {}),
        ...(accentOf(plan) ? { accent: accentOf(plan) } : {}),
        title: text(heading),
        price: text(price),
        details: portableText(details, context, `${prefix}-p${i}`).filter((entry) => entry._type === 'block'),
        actions: sourceActions(buttonLinks(plan), context, `${prefix}-p${i}`),
      };
    });
    return;
  }

  if (type === 'faqAccordion') {
    if (title) block.title = plainBlocks(text(title), `${prefix}-title`);
    block.subtitle = text(withoutTitle(title?.parentElement ?? staticNode, title, NON_COPY));
    block.actions = sourceActions(buttonLinks(staticNode), context, prefix);
    const category = faqCategory(original, snapshot);
    if (category) block.category = category;
    return;
  }

  if (type === 'cardSlider') {
    const heading = staticNode.querySelector('[class*="_heading-wrapper"]') ?? staticNode;
    block.tagline = tagline(heading);
    const sourceHeading = bySuffix(original, '_heading-wrapper')[0] ?? original;
    const icon = iconFromSvg([...sourceHeading.querySelectorAll('.button-group svg')].find((svg) => !svg.closest('a,.button')));
    if (icon) block.icon = icon;
    const accent = accentOf(sourceHeading.querySelector('.button-group [class*="u-color-accent"]'));
    if (accent) block.accent = accent;
    block.description = [...heading.querySelectorAll('p')].map(lines).filter(Boolean).join('\n');
    block.actions = sourceActions(buttonLinks(staticNode), context, prefix);
    // Calendar days show each character with the template's visit time.
    const characterTime = [...original.querySelectorAll('.event19_meta-wrapper [class="display-inlineflex"]')]
      .map(text).find((value) => /^–\s*\S/.test(value) && /\d/.test(value));
    if (block.source === 'playgroundEvent' && characterTime) block.characterTime = characterTime.replace(/^–\s*/, '');
    return;
  }

  if (type === 'embedSection') {
    block.tagline = tagline(staticNode);
    block.description = [...staticNode.querySelectorAll('.text-align-center p')].map(lines).filter(Boolean).join('\n') || undefined;
    const rich = staticNode.querySelector('.w-richtext');
    block.body = rich ? portableText(without(rich, NON_COPY), context, prefix) : undefined;
    block.actions = sourceActions(buttonLinks(staticNode), context, prefix);
    return;
  }

  if (type === 'programCards' && selector?.startsWith('section_summer-camp_')) {
    // The cards are program offering records; the section keeps its intro.
    const intro = staticNode.querySelector('.max-width-large') ?? staticNode;
    block.breadcrumbs = breadcrumbs(intro, context, prefix);
    block.tagline = tagline(intro);
    block.description = [...intro.querySelectorAll('p')].map(text).filter(Boolean).join('\n');
    staticNode.querySelectorAll('.summer-camp_programs_grid-list,.summer-camp_additional-programs_list').forEach((node) => node.remove());
    return;
  }

  if (type === 'electiveCards' && selector === 'section_summer-camp_club-day-electives') {
    const copy = bySuffix(staticNode, '_content-left')[0] ?? staticNode;
    block.tagline = tagline(copy);
    // A second label under the heading is the lead sentence.
    const lead = [...copy.querySelectorAll('.text-style-tagline')].slice(1).map(text).filter(Boolean).join('\n');
    if (lead) block.description = lead;
    else delete block.description;
    block.features = featureItems(original, context, prefix);
    bySuffix(copy, '_item-list').forEach((node) => node.setAttribute('data-import-features', ''));
    block.content = textBlocks(withoutTitle(copy, title, `${NON_COPY},[data-import-features]`), context, prefix);
    block.cards = [];
    block.actions = sourceActions(buttonLinks(staticNode), context, prefix);
    return;
  }

  if (type === 'historyStory') {
    block.tagline = tagline(staticNode);
    block.features = featureItems(original, context, prefix);
    bySuffix(staticNode, '_item-list').forEach((node) => node.setAttribute('data-import-features', ''));
    block.body = textBlocks(withoutTitle(staticNode, title, `${NON_COPY},[data-import-features]`), context, prefix);
    block.cards = [];
    block.actions = sourceActions(buttonLinks(staticNode), context, prefix);
    delete block.description;
    return;
  }

  if (type === 'stackedTimeline' && selector === 'section_summer-camp_enrollment-process-timeline') {
    const intro = bySuffix(staticNode, '_content-left')[0] ?? staticNode;
    block.eyebrow = text(intro.querySelector('.text-style-tagline'));
    block.intro = [...intro.querySelectorAll('p')].map(text).filter(Boolean).join('\n');
    block.buttons = sourceButtons(buttonLinks(intro), context, prefix);
    // Each step: a large step label, its name and one paragraph.
    block.items = bySuffix(staticNode, '_item').filter((node) => node.querySelector('h3,h4')).map((node, i) => ({
      _key: key(`${prefix}-t${i}`), _type: 'stackedTimelineItem',
      meta: text(node.querySelector('h3')), title: text(node.querySelector('h4')),
      // Several paragraphs or a link need the step's rich text.
      ...(node.querySelectorAll('p').length > 1 || node.querySelector('p a')
        ? { body: textBlocks(without(node, `${NON_COPY},h3,h4`), context, `${prefix}-t${i}`) }
        : { text: text(node.querySelector('p')) }),
    }));
    return;
  }

  if (type === 'quoteWall') {
    // The program photos are declared in the Webflow stylesheet, not the HTML.
    const photo = original.classList.contains('is-summer-camp') ? '67a5d0a3369797b17dbfc98b_summer-camp-maplewood-wow-testimonies-1.avif'
      : original.classList.contains('is-school-year') ? '67a393b21ae00bf865cee52e_maplewood-preschooler.avif' : undefined;
    if (photo) block.backgroundImage = context.asset(`https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/${photo}`, 'image');
    const heading = staticNode.querySelector('h2');
    const badge = heading?.querySelector('.school-year,.summer-camp');
    const highlight = highlightOf(heading) || text(badge);
    if (highlight) block.eyebrow = highlight;
    if (badge) block.eyebrowProgram = programOf(badge);
    const rest = heading && without(heading, '[class*="text-color-brand-secondary"],.school-year,.summer-camp');
    if (rest && text(rest)) block.heading = plainBlocks(text(rest), `${prefix}-title`);
    block.subtitle = text(heading?.closest('.max-width-large')?.querySelector('p')) || undefined;
    // The closing lines under the testimonials, one per line.
    const closing = [...staticNode.querySelectorAll('.text-align-center')].at(-1);
    block.description = closing ? [...closing.children].map(text).filter(Boolean).join('\n') : undefined;
    // The live wall is a filtered list that ignores the Visible switch, so
    // keep the displayed testimonials, in order, as the section's selection.
    const selected = selectedTestimonials(original, snapshot);
    if (selected) block.selectedTestimonials = selected;
    return;
  }

  if (type === 'instructionSteps') {
    // Step numbers are drawn from the order of the steps.
    staticNode.querySelectorAll('[class*="_number"]').forEach((node) => node.remove());
    // The steps have no section heading or buttons of their own.
    for (const field of ['title', 'description', 'actions']) delete block[field];
    block.cards = bySuffix(staticNode, '_content').filter((node) => node.querySelector('h2,h3')).map((node, i) => ({
      _key: key(`${prefix}-c${i}`), _type: 'contentCard',
      eyebrow: text(node.querySelector('.text-style-tagline')),
      title: text(node.querySelector('h2,h3')),
      body: portableText(without(node, `${NON_COPY},h2,h3`), context, `${prefix}-c${i}`),
    }));
    return;
  }

  if (type === 'ctaBanner') {
    const content = staticNode.querySelector('[class*="_card-content"]') ?? staticNode;
    if (title) block.title = text(title);
    block.body = textBlocks(withoutTitle(content, title, NON_COPY), context, prefix);
    delete block.description;
    const image = staticNode.querySelector('img');
    if (image) block.image = context.asset(image.getAttribute('src'), 'image', image.getAttribute('alt') ?? '');
    block.buttons = sourceButtons(buttonLinks(staticNode), context, prefix);
    // A reminder band (cta13) shows an icon in its accent before the heading.
    const icon = iconFromSvg(original.querySelector('[class*="_content-left"] svg'));
    if (icon) block.icon = icon;
    const accent = accentOf(original.querySelector('[class*="u-accent-"]'));
    if (icon && accent) block.accent = accent;
    return;
  }

  if (type === 'statistics') {
    const left = bySuffix(staticNode, '_content-left')[0] ?? staticNode;
    block.tagline = tagline(left);
    block.title = text(headingOf(left));
    block.text = textBlocks(withoutTitle(left, headingOf(left), `${NON_COPY},[class*="_item-list"],[class*="team4"]`), context, prefix);
    block.items = bySuffix(original, '_item').filter((node) => node.querySelector('[class*="_number"]')).map((node, i) => ({
      _key: key(`${prefix}-s${i}`), _type: 'statistic',
      value: text(node.querySelector('[class*="_number"]')),
      label: text(node.querySelector('h3,h4')),
      text: textBlocks(without(node, `${NON_COPY},[class*="_number"],h3,h4`), context, `${prefix}-s${i}`),
      ...(accentOf(node) ?? iconAccent(node) ? { accent: accentOf(node) ?? iconAccent(node) } : {}),
    }));
    block.actions = sourceActions(buttonLinks(staticNode), context, prefix);
    // A photo beside the text (the /history figures); staff portraits are a list.
    const image = [...staticNode.querySelectorAll('img')].find((node) => !node.closest('[class*="team4"]'));
    if (image) block.image = context.asset(image.getAttribute('src'), 'image', image.getAttribute('alt') ?? '');
    // The staff list under the figures shows the program's preschool teachers.
    if (original.querySelector('.team4_component .w-dyn-list')) {
      block.preschoolTeachers = true;
      if (block.tagline?.program) block.program = block.tagline.program;
    }
    delete block.description;
    return;
  }

  if (type === 'teamMembers' && block.presentation === 'tour') {
    // A tour invitation beside the portraits of the staff who give tours.
    const badge = staticNode.querySelector('.school-year,.summer-camp');
    if (badge) block.eyebrow = text(badge);
    block.title = text(title);
    block.richText = textBlocks(withoutTitle(staticNode, title, `${NON_COPY},.school-year,.summer-camp`), context, prefix);
    block.actions = sourceActions(buttonLinks(staticNode), context, prefix);
    block.tourGuidesOnly = true;
    return;
  }

  if (type === 'teamMembers' && block.profileGroup === 'leadership') {
    // The profiles are the leadership staff records, not section copy.
    bySuffix(staticNode, '_item').forEach((node) => node.remove());
    block.richText = textBlocks(without(staticNode, NON_COPY), context, prefix);
    return;
  }

  if (type === 'teamMembers' && block.profileGroup === 'roster') {
    const parts = [...staticNode.querySelectorAll('[class*="max-width"]')];
    const closing = parts.length > 1 ? parts.at(-1) : undefined;
    delete block.title;
    block.richText = textBlocks(parts[0] && parts[0] !== closing ? parts[0] : without(staticNode, NON_COPY), context, prefix);
    if (closing) {
      block.closingTitle = text(closing.querySelector('h2,h3,h4'));
      block.closingText = [...closing.querySelectorAll('p')].map(text).join('\n');
      block.actions = sourceActions(buttonLinks(closing), context, prefix);
    }
  }
}

// An ID used twice on a source page anchors its last section, the target of
// the page's own links (for example #preschoolers-sessions).
export function sectionAnchors(nodes) {
  const anchors = new Map();
  for (const node of nodes) if (node.id && !node.id.startsWith('w-node-')) anchors.set(node.id, node);
  return anchors;
}
