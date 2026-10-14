import test from 'node:test';
import assert from 'node:assert/strict';
import {comparePage, expectedCanonical, pathOf, readSeoTags, robotsDirectives} from './seo-parity.mjs';

const webflowHead = `<html><head><title>Dates &amp; Rates | Maplewood</title>
<meta content="Summer camp rates." name="description"/>
<meta content="Dates &amp; Rates | Maplewood" property="og:title"/>
<meta content="https://cdn.example.com/a.webp" property="og:image"/>
<meta content="website" property="og:type"/>
</head><body><meta name="description" content="Not in the head"></body></html>`;

test('tags are read from the head whatever the attribute order', () => {
  const tags = readSeoTags(webflowHead);
  assert.equal(tags.title, 'Dates & Rates | Maplewood');
  assert.equal(tags.description, 'Summer camp rates.');
  assert.equal(tags['og:title'], 'Dates & Rates | Maplewood');
  assert.equal(tags.canonical, undefined);
  assert.deepEqual(tags.jsonLdTypes, []);
});

test('canonicals name the www host without a trailing slash', () => {
  assert.equal(expectedCanonical('/'), 'https://www.maplewoodyearround.com');
  assert.equal(expectedCanonical('/news'), 'https://www.maplewoodyearround.com/news');
  assert.equal(pathOf('https://www.maplewoodyearround.com/news/'), '/news');
  assert.equal(pathOf('https://www.maplewoodyearround.com'), '/');
});

test('a page with the same tags has no differences; images count by presence', () => {
  const live = {status: 200, tags: readSeoTags(webflowHead)};
  const next = {
    status: 200,
    tags: {
      ...readSeoTags(webflowHead),
      'og:image': 'https://cdn.sanity.io/b.webp',
      canonical: 'https://www.maplewoodyearround.com/summer-camp/dates-and-rates',
      robots: 'index, follow',
    },
  };
  assert.deepEqual(comparePage('/summer-camp/dates-and-rates', live, next), []);
});

test('a changed title, a wrong canonical, noindex and a missing page are reported', () => {
  const live = {status: 200, tags: readSeoTags(webflowHead)};
  const next = {
    status: 200,
    tags: {...readSeoTags(webflowHead), title: 'Dates & Rates | Maplewood | Maplewood', canonical: 'https://x.vercel.app/a', robots: 'noindex'},
  };
  assert.deepEqual(comparePage('/a', live, next).map(({field}) => field), ['canonical', 'robots', 'title']);
  assert.deepEqual(comparePage('/a', live, {status: 404, tags: {jsonLdTypes: []}}).map(({field}) => field).slice(0, 2), ['status', 'canonical']);
});

test('robots.txt directives compare without case, order or repeats', () => {
  const webflow = 'User-agent: *\nAllow: /\nDisallow: /*?\nSitemap: https://www.maplewoodyearround.com/sitemap.xml\n\nSitemap: https://www.maplewoodyearround.com/sitemap.xml';
  const next = 'User-Agent: *\nDisallow: /*?\nAllow: /\n\nSitemap: https://www.maplewoodyearround.com/sitemap.xml\n';
  assert.deepEqual(robotsDirectives(webflow), robotsDirectives(next));
});
