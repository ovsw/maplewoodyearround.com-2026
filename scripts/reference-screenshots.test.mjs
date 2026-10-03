import test from 'node:test';
import assert from 'node:assert/strict';
import {imageName, pagePath, viewports} from './reference-screenshots.mjs';

test('reference names preserve nested routes at the two required widths', () => {
  assert.equal(imageName('/', 1440), 'home-1440.png');
  assert.equal(imageName('/summer-camp/activities/', 390), 'summer-camp/activities-390.png');
  assert.deepEqual(viewports.map(({width}) => width), [1440, 390]);
});

test('page paths cannot escape the reference or output directories', () => {
  for (const route of ['https://example.com', '//example.com', '/../private', '/a/%2e%2e/private', '/a\\private', '/a?draft=1', '/a#hero']) {
    assert.throws(() => pagePath(route));
  }
});
