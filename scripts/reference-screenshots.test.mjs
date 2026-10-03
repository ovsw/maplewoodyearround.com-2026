import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {captureRoute, imageName, pagePath, viewports} from './reference-screenshots.mjs';

test('reference names preserve nested routes at the two required widths', () => {
  assert.equal(imageName('/', 1440), 'home-1440.png');
  assert.equal(imageName('/summer-camp/activities/', 390), 'summer-camp/activities-390.png');
  assert.deepEqual(viewports.map(({width}) => width), [1440, 390]);
});

test('a failed refresh keeps successful viewport metadata and resumes only missing captures', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'reference-refresh-'));
  try {
    const manifest = {expectedCaptures: 2, pages: viewports.map(viewport => ({
      path: '/', file: imageName('/', viewport.width), viewport, capturedAt: 'old',
    }))};
    await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
    for (const entry of manifest.pages) await writeFile(path.join(directory, entry.file), 'old');
    await assert.rejects(captureRoute(manifest, '/', async (viewport, file) => {
      if (viewport.width === 390) throw new Error('network failure');
      await writeFile(path.join(directory, file), 'new desktop');
      return {viewport, capturedAt: 'new desktop'};
    }, {refresh: true, directory}), /network failure/);

    const saved = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
    assert.equal(saved.complete, false);
    assert.equal(saved.completedCaptures, 1);
    assert.equal(saved.pages[0].capturedAt, 'new desktop');
    const retried = [];
    await captureRoute(saved, '/', async (viewport, file) => {
      retried.push(viewport.width);
      await writeFile(path.join(directory, file), 'new mobile');
      return {viewport, capturedAt: 'new mobile'};
    }, {directory});
    assert.deepEqual(retried, [390]);
    const completed = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
    assert.equal(completed.complete, true);
    assert.deepEqual(completed.pages.map(entry => entry.capturedAt), ['new desktop', 'new mobile']);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});

test('page paths cannot escape the reference or output directories', () => {
  for (const route of ['https://example.com', '//example.com', '/../private', '/a/%2e%2e/private', '/a\\private', '/a?draft=1', '/a#hero']) {
    assert.throws(() => pagePath(route));
  }
});
