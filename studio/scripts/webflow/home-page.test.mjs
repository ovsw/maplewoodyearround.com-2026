import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assetCollector, htmlDocument } from "./html.mjs";
import { staticPages } from "./pages.mjs";

const schema = JSON.parse(
  await readFile(new URL("../../schema.json", import.meta.url), "utf8"),
);
const fixture = `<html><head><title>Home SEO</title><meta name="description" content="Home description"></head><body><main>
<section class="section_header33"><h1>A <span class="text-color-brand-secondary">summer adventure</span> today</h1><p>Intro only.</p><a href="/camp" class="button">Camp info</a><video poster="https://cdn.prod.website-files.com/site/poster.jpg"><source src="https://cdn.prod.website-files.com/site/video.mp4"></video></section>
<section class="section_layout515"><div class="layout515_content-right"><img src="https://cdn.prod.website-files.com/site/desktop.jpg"></div><div class="layout515_item"><div class="text-style-tagline">Our promise</div><h2>Family</h2><p>Read <a href="/camp">our camp</a>.</p><a class="button" href="/camp">Details</a><img src="https://cdn.prod.website-files.com/site/mobile.jpg"></div></section>
<section class="section_testimonials_testimonial11"><h2>Parent Testimonials</h2><div class="w-dyn-list"><div class="wall-of-love_item">Second quote. Parent, Summer Camp</div><div class="wall-of-love_item">First quote. Parent, Summer Camp</div></div><p>Closing text.</p></section>
<section class="section_blog7"><div class="text-style-tagline">Blog</div><h1>News</h1><p>News intro.</p><div class="w-dyn-list"><div class="blog7_featured-item"><h2>Featured</h2></div><div class="blog7_item"><h2>Card</h2></div></div><div class="u-display-hidden"><a href="#">Hidden filter</a></div></section>
</main></body></html>`;

function plan(path = "/", html = fixture) {
  const dom = htmlDocument(html);
  const collections = [
    {
      id: "quotes",
      displayName: "Testimonials",
      live: [
        { id: "empty", fieldData: { "testimonial-text": "   " } },
        { id: "missing", fieldData: {} },
        { id: "one", fieldData: { "testimonial-text": "First quote." } },
        { id: "two", fieldData: { "testimonial-text": "Second quote." } },
        { id: "unplaced", fieldData: { "testimonial-text": "Never placed." } },
      ],
    },
    {
      id: "posts",
      displayName: "Blog Posts",
      live: [
        { id: "featured", fieldData: { name: "Featured" } },
        { id: "card", fieldData: { name: "Card" } },
        { id: "other", fieldData: { name: "Unrelated newest post" } },
      ],
    },
  ];
  const context = {
    ...assetCollector(),
    routes: new Map([["/camp", "camp"]]),
    pageDocuments: new Map([[path, dom]]),
  };
  const result = staticPages(
    { pages: [{ path, status: 200 }], collections },
    context,
    schema,
  );
  return { ...result, assets: [...context.assets.values()] };
}
test("home keeps prose, inline links, labels, actions and device-specific media in separate editable slots", () => {
  const result = plan();
  assert.deepEqual(result.gaps, []);
  const [hero, panels] = result.documents[0].blocks;
  assert.equal(hero.description, "Intro only.");
  assert.equal(hero.title, "A summer adventure today");
  assert.equal(hero.highlightText, "summer adventure");
  assert.ok(hero.videoMp4.asset._ref);
  const card = panels.cards[0];
  assert.equal(card.eyebrow, "Our promise");
  assert.notEqual(card.image.asset._ref, card.mobileImage.asset._ref);
  assert.deepEqual(
    card.actions.map((action) => action.label),
    ["Details"],
  );
  assert.equal(
    card.body[0].children.map((span) => span.text).join(""),
    "Read our camp.",
  );
  assert.equal(card.body[0].markDefs[0].customLink.internal._ref, "camp");
});
test("home selects source testimonial and news records in visible order, excluding unplaced records", () => {
  const blocks = plan().documents[0].blocks;
  assert.deepEqual(
    blocks[2].selectedTestimonials.map((ref) => ref._ref),
    ["wf-quotes-two", "wf-quotes-one"],
  );
  assert.equal(blocks[2].description, "Closing text.");
  const background = plan().assets.find(
    (asset) => asset.token === blocks[2].backgroundImage.asset._ref,
  );
  assert.equal(
    background.url,
    "https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67a5d0a3369797b17dbfc98b_summer-camp-maplewood-wow-testimonies-1.avif",
  );
  assert.equal(background.kind, "image");
  assert.deepEqual(
    blocks[3].selectedPosts.map((ref) => ref._ref),
    ["wf-posts-featured", "wf-posts-card"],
  );
  assert.equal(blocks[3].featuredFirst, true);
  assert.doesNotMatch(JSON.stringify(blocks[3]), /Unrelated|Hidden filter/);
});
test("bus cards only remove a heading when it is the description prefix", () => {
  const html = `<html><body><main><section class="section_transportation_contact14">
    <h2>Bus service</h2><div class="bus_card"><h3>Door to door</h3><p>Ride with us.</p></div>
    <div class="bus_card"><p>Keep this introduction.</p><h3>Our routes</h3><p>See all stops.</p></div>
  </section></main></body></html>`;
  const [first, second] = plan("/", html).documents[0].blocks[0].cards;
  assert.equal(first.description, "Ride with us.");
  assert.equal(
    second.description,
    "Keep this introduction.Our routesSee all stops.",
  );
});
test("home parsing changes do not change other pages using the same section types", () => {
  const blocks = plan("/other").documents[0].blocks;
  assert.equal(blocks[0].highlightText, undefined);
  assert.equal(blocks[2].selectedTestimonials, undefined);
  assert.equal(blocks[3].selectedPosts, undefined);
  assert.match(blocks[0].description, /Camp info/);
});
