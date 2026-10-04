import { key, text, destination, customUrl, plainBlocks, portableText, reference, documentId } from './html.mjs';

// Source slots of the shared inner-page sections. These run on every page
// except home, so each mapping depends on the source component, never a path.

const ACCENTS = new Set(['blue', 'red', 'purple', 'mint', 'yellow']);
const PROGRAM_CLASSES = { 'summer-camp': 'summerCamp', 'school-year': 'schoolYear' };

// Section backgrounds resolved from the live stylesheet's rule order and
// specificity. Unlisted components keep the importer's generic choice.
const BACKGROUNDS = {
  section_layout10: 'cream', section_layout203: 'white', section_layout30: 'white',
  section_comparison8: 'cream', 'section_k-9-sessions-table_comparison6': 'white',
  section_pricing19: 'white', section_faq3: 'white', section_blog66: 'cream',
  section_layout486: 'white', section_cta39: 'white', section_team4: 'white',
  section_content30: 'white', section_gallery1: 'white',
};

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

function backgroundOf(selector, node) {
  if (selector === 'section_faq3') return node.classList.contains('alt') ? 'cream' : 'white';
  if (selector === 'section_blog66' && node.classList.contains('background-color-white')) return 'white';
  return BACKGROUNDS[selector];
}

export function mapSourceSections({ type, selector, original, staticNode, block, context, prefix, snapshot, anchors }) {
  if (backgroundOf(selector, original) && 'background' in block) block.background = backgroundOf(selector, original);
  if (original.id && anchors.get(original.id) === original) block.anchorId = original.id;
  const title = headingOf(staticNode);

  if (type === 'innerHero') {
    const content = staticNode.querySelector('[class*="_content-wrap"]') ?? staticNode;
    block.breadcrumbs = [...content.querySelectorAll('.breadcrumb_component a')].filter((a) => text(a)).map((a, i) => {
      const target = destination(a.getAttribute('href'), context);
      return { _key: key(`${prefix}-crumb${i}`), _type: 'breadcrumb', label: text(a), ...(target ? { destination: target } : {}), ...(programOf(a) ? { program: programOf(a) } : {}) };
    });
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
    block.tagline = tagline(staticNode);
    block.headingSize = title?.matches('.heading-style-h4,h3,h4') ? 'small' : 'large';
    const image = staticNode.querySelector('img');
    // A source image placed before the copy renders on the left.
    block.imagePosition = image && title && image.compareDocumentPosition(title) & 4 ? 'left' : 'right';
    block.features = featureItems(original, context, prefix);
    bySuffix(staticNode, '_item-list').forEach((node) => node.setAttribute('data-import-features', ''));
    block.richText = textBlocks(withoutTitle(staticNode, title, `${NON_COPY},[data-import-features]`), context, prefix);
    block.buttons = sourceButtons(buttonLinks(staticNode), context, prefix);
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
    // Paragraphs before the table introduce it; those after it close it.
    const paragraphs = [...staticNode.querySelectorAll('p')].filter((p) => !p.closest('[class*="_row"]'));
    const before = paragraphs.filter((p) => p.compareDocumentPosition(top) & 4);
    const after = paragraphs.filter((p) => !before.includes(p));
    const blocksOf = (nodes, suffix) => textBlocks(Object.assign(staticNode.ownerDocument.createElement('div'), { innerHTML: nodes.map((p) => p.outerHTML).join('') }), context, `${prefix}-${suffix}`);
    block.tagline = tagline(staticNode);
    block.intro = blocksOf(before, 'intro');
    block.columns = [...top.children].map((node, i) => rateColumn(node, context, prefix, i));
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
    const intro = without(staticNode, `${NON_COPY},[class*="_grid-list"],[class*="_plan"]`);
    block.description = [...intro.querySelectorAll('p')].map(text).filter(Boolean).join('\n');
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
    const icon = iconFromSvg(sourceHeading.querySelector('.button-group svg'));
    if (icon) block.icon = icon;
    const accent = accentOf(sourceHeading.querySelector('.button-group [class*="u-color-accent"]'));
    if (accent) block.accent = accent;
    block.description = [...heading.querySelectorAll('p')].map(text).filter(Boolean).join('\n');
    block.actions = sourceActions(buttonLinks(staticNode), context, prefix);
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
