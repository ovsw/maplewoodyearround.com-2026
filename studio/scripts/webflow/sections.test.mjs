import test from 'node:test';
import assert from 'node:assert/strict';
import { assetCollector, destination, htmlDocument } from './html.mjs';
import { iconFromSvg, mapSourceSections, sectionAnchors, sourceButtons, tagline } from './sections.mjs';

const context = () => ({ ...assetCollector(), routes: new Map([['/contact', 'contact-page']]), warnings: new Set(), identities: new Map() });
const body = (html) => htmlDocument(html).body;

test('icon artwork keeps drawing markup and drops anything outside the allowlist', () => {
  const svg = body('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" class="iconify" viewBox="0 0 24 24" onload="alert(1)"><script>alert(1)</script><path fill="currentColor" d="M1 1h2"/><foreignObject><div>x</div></foreignObject></svg>').querySelector('svg');
  assert.deepEqual(iconFromSvg(svg), { _type: 'icon', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M1 1h2"></path></svg>' });
});

test('a label splits its program badge from the text after the dash', () => {
  assert.deepEqual(tagline(body('<div class="text-style-tagline"><span class="summer-camp">Summer Camp</span><span> – Swimming</span></div>')),
    { _type: 'tagline', label: 'Summer Camp', program: 'summerCamp', text: 'Swimming' });
  assert.deepEqual(tagline(body('<div class="text-style-tagline summer-camp">Don\'t be shy!</div>')),
    { _type: 'tagline', label: 'Don\'t be shy!', program: 'summerCamp' });
  assert.deepEqual(tagline(body('<div class="text-style-tagline">Transportation</div>')), { _type: 'tagline', text: 'Transportation' });
});

test('same-page links keep their fragment; empty links stay without a destination', () => {
  assert.deepEqual(destination('#bus-map', context()), { _type: 'contentDestination', kind: 'external', external: '#bus-map' });
  const [hidden, link] = sourceButtons([...body('<a class="button is-secondary" href="#">Android</a><a class="button is-link" href="#safety">Safety</a>').querySelectorAll('a')], context(), 'p');
  assert.equal(hidden.url, undefined);
  assert.equal(hidden.variant, 'outline');
  assert.equal(link.url.external, '#safety');
  assert.equal(link.variant, 'link');
});

test('a repeated source ID anchors only its last section', () => {
  const nodes = [...body('<section id="a"></section><section id="a"></section><section id="w-node-x"></section>').querySelectorAll('section')];
  const anchors = sectionAnchors(nodes);
  assert.equal(anchors.get('a'), nodes[1]);
  assert.equal(anchors.has('w-node-x'), false);
});

test('backgrounds follow the source page alternation rule when the page has it', () => {
  const page = htmlDocument('<main><header></header><section class="section_layout203"><h2>One</h2></section><section class="section_layout203"><h2>Two</h2></section></main>');
  const [first, second] = page.querySelectorAll('section');
  const map = (original, html) => {
    const block = { _type: 'storyFeature', background: 'white' };
    mapSourceSections({ type: 'storyFeature', selector: 'section_layout203', original, staticNode: original.cloneNode(true), block, context: context(), prefix: 'p', snapshot: {}, anchors: new Map(), html });
    return block.background;
  };
  const rule = '<style>main section:nth-of-type(odd) { background: transparent }</style>';
  assert.deepEqual([map(first, rule), map(second, rule)], ['cream', 'white']);
  assert.deepEqual([map(first, ''), map(second, '')], ['white', 'white']);
});

test('an FAQ list uses the one category whose questions are exactly the ones shown', () => {
  const faqs = { displayName: 'FAQs', fields: [{ slug: 'category', validations: { collectionId: 'cats' } }], live: [
    { fieldData: { name: 'Deposit', category: ['summer', 'payment'] } },
    { fieldData: { name: 'Discounts', category: ['summer', 'payment'] } },
    { fieldData: { name: 'Lunch', category: ['summer'] } },
  ] };
  const original = body('<section class="section_faq3"><h2>Payments</h2><div class="w-dyn-list"><div class="w-dyn-item"><div class="faq3_question">Deposit</div></div><div class="w-dyn-item"><div class="faq3_question">Discounts</div></div></div></section>').querySelector('section');
  const block = { _type: 'faqAccordion' };
  mapSourceSections({ type: 'faqAccordion', selector: 'section_faq3', original, staticNode: original.cloneNode(true), block, context: context(), prefix: 'p', snapshot: { collections: [faqs] }, anchors: new Map(), html: '' });
  assert.deepEqual(block.category, { _type: 'reference', _ref: 'wf-cats-payment' });
});
