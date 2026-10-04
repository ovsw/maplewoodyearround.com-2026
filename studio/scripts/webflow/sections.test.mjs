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

test('a rate table built from an HTML table keeps the generic table mapping', () => {
  const original = body('<section class="section_comparison8"><h2>Rates</h2><table><tr><th>Weeks</th><th>Price</th></tr><tr><td>2</td><td>$1</td></tr></table></section>').querySelector('section');
  const block = { _type: 'rateTable', columns: ['Weeks', 'Price'], rows: [] };
  assert.doesNotThrow(() => mapSourceSections({ type: 'rateTable', selector: 'section_comparison8', original, staticNode: original.cloneNode(true), block, context: context(), prefix: 'p', snapshot: {}, anchors: new Map(), html: '' }));
  assert.deepEqual(block.columns, ['Weeks', 'Price']);
});

const mapped = (type, selector, html, block = { _type: type }) => {
  const original = body(html).querySelector('section');
  const staticNode = original.cloneNode(true);
  mapSourceSections({ type, selector, original, staticNode, block, context: context(), prefix: 'p', snapshot: {}, anchors: new Map(), html: '' });
  return { block, staticNode };
};

test('summer program cards keep the intro and leave the cards to the program records', () => {
  const { block, staticNode } = mapped('programCards', 'section_summer-camp_programs', `<section class="section_summer-camp_programs"><div class="max-width-large">
    <div class="breadcrumb_component"><a class="breadcrumb-link" href="/">Home</a><a class="breadcrumb-link summer-camp" href="#">Summer Camp</a></div>
    <h2>Summer Camp Programs</h2><p>For all ages.</p></div>
    <div class="summer-camp_programs_grid-list"><a class="summer-camp_programs_card" href="/x"><h3>Preschool</h3><p>Fun.</p></a></div></section>`);
  assert.deepEqual(block.breadcrumbs.map((crumb) => [crumb.label, crumb.program ?? null, Boolean(crumb.destination)]), [['Home', null, true], ['Summer Camp', 'summerCamp', false]]);
  assert.equal(block.description, 'For all ages.');
  assert.equal(staticNode.querySelector('.summer-camp_programs_grid-list'), null);
});

test('club day electives split the lead, points and text', () => {
  const { block } = mapped('electiveCards', 'section_summer-camp_club-day-electives', `<section class="section_summer-camp_club-day-electives"><div class="summer-camp_electives_content-left">
    <div class="text-style-tagline"><span class="summer-camp">Summer Camp</span><span> – Custom Schedule</span></div><h2>Club Day Electives</h2>
    <div class="text-style-tagline">Four afternoons per week.</div><p>Choose <a href="/contact">options</a>.</p>
    <div class="summer-camp_electives_item-list"><div class="summer-camp_electives_item u-accent-blue"><h3>Huge Selection</h3><p>Many.</p></div></div>
    </div><img src="https://cdn.prod.website-files.com/a/b.jpg" alt="Boat"></section>`, { _type: 'electiveCards', cards: [{}], description: 'raw' });
  assert.equal(block.description, 'Four afternoons per week.');
  assert.deepEqual(block.features.map((point) => [point.title, point.accent]), [['Huge Selection', 'blue']]);
  assert.equal(block.content.map((entry) => entry.children.map((span) => span.text).join('')).join(''), 'Choose options.');
  assert.deepEqual(block.cards, []);
  assert.deepEqual(block.tagline, { _type: 'tagline', label: 'Summer Camp', program: 'summerCamp', text: 'Custom Schedule' });
});

test('the enrollment timeline keeps each step label, name and text', () => {
  const { block } = mapped('stackedTimeline', 'section_summer-camp_enrollment-process-timeline', `<section class="section_summer-camp_enrollment-process-timeline">
    <div class="summer-camp_timeline_content-left"><div class="text-style-tagline">How to Enroll</div><h2>Discover</h2><p>Easy.</p><div class="button-group"><a class="button is-secondary" href="/contact">Get In Touch</a></div></div>
    <div class="summer-camp_timeline_item"><h3>Step 1</h3><h4>Create an account</h4><p>Details.</p></div>
    <div class="summer-camp_timeline_item"><h3>Step 2</h3><h4>Apply</h4><p>Form.</p></div></section>`);
  assert.equal(block.eyebrow, 'How to Enroll');
  assert.equal(block.intro, 'Easy.');
  assert.deepEqual(block.items.map(({ meta, title, text }) => [meta, title, text]), [['Step 1', 'Create an account', 'Details.'], ['Step 2', 'Apply', 'Form.']]);
  assert.equal(block.buttons[0].url.internal._ref, 'contact-page');
});

test('an inner testimonial wall keeps its highlighted line, intro and closing lines', () => {
  const { block } = mapped('quoteWall', 'section_testimonials_testimonial11', `<section class="section_testimonials_testimonial11 is-summer-camp"><div class="max-width-large">
    <h2><span class="text-color-brand-secondary-mid">Summer Camp</span><br>Parent Testimonials</h2><p>Here's what families say:</p></div>
    <div class="text-align-center"><div>We could go on...</div><div>...more of the same</div></div></section>`);
  assert.equal(block.eyebrow, 'Summer Camp');
  assert.equal(block.heading[0].children[0].text, 'Parent Testimonials');
  assert.equal(block.subtitle, "Here's what families say:");
  assert.equal(block.description, 'We could go on...\n...more of the same');
  assert.equal(block.backgroundImage._type, 'image');
});

test('a points heading is not the section heading, and a one-price table gets an unnamed column', () => {
  const { block: story } = mapped('storyFeature', 'section_layout30', `<section class="section_layout30"><div class="layout30_item-list"><div class="layout30_item"><h3>3:1 Ratio</h3><p>Low.</p></div></div></section>`,
    { _type: 'storyFeature', title: [{ _type: 'block' }] });
  assert.equal(story.title, undefined);
  assert.deepEqual(story.features.map((point) => point.title), ['3:1 Ratio']);

  const { block: table } = mapped('rateTable', 'section_k-9-sessions-table_comparison6', `<section class="section_k-9-sessions-table_comparison6"><h2>Rates</h2>
    <div class="comparison6_top-row"><div></div></div><div class="comparison6_row"><div>8 weeks</div><div>$5,925</div></div></section>`,
    { _type: 'rateTable', rows: [{ label: '8 weeks', cells: ['$5,925'] }] });
  assert.equal(table.columns.length, 2);
  assert.equal(table.columns[1].label, '');
});
