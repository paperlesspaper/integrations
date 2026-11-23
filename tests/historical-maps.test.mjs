import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { defaults, selectMap } from '../applications/historical-maps/assets/selection.js';
const root = new URL('../applications/historical-maps/', import.meta.url);
const maps = JSON.parse(await readFile(new URL('data/maps.json', root)));
const select = (settings = {}, date = '2026-10-06T12:00:00Z') => selectMap(maps, { ...defaults, ...settings }, new Date(date));

test('rotation uses civil midnight in selected timezone, including DST', () => {
  assert.equal(select({}, '2026-03-28T23:01:00Z').map.id, select({}, '2026-03-29T21:59:00Z').map.id);
  assert.notEqual(select({}, '2026-03-29T21:59:00Z').map.id, select({}, '2026-03-29T22:01:00Z').map.id);
  assert.equal(select({ timeZone: 'America/New_York' }, '2026-10-06T02:00:00Z').day, '2026-10-05');
  assert.equal(select({}, '2026-10-06T02:00:00Z').day, '2026-10-06');
});
test('a complete cycle contains every map exactly once, including negative offsets', () => {
  const ids = Array.from({ length: maps.length }, (_, i) => select({ dayOffset: i - 4 }).map.id);
  assert.equal(new Set(ids).size, maps.length);
  assert.equal(select({ dayOffset: maps.length }).map.id, select().map.id);
});
test('pinned map stays stable across dates and offsets', () => {
  assert.equal(select({ mapId: 'paris-1878', dayOffset: -12 }).map.id, 'paris-1878');
  assert.equal(select({ mapId: 'paris-1878' }, '2030-01-01T00:00:00Z').map.id, 'paris-1878');
});
test('invalid settings fail explicitly instead of silently changing the selected map', () => {
  assert.throws(() => select({ mapId: '../not-a-map' }), /unknownMap/);
  assert.throws(() => select({ timeZone: 'Invalid/Zone' }), RangeError);
  for (const dayOffset of ['oops', 0.5, Infinity, 3651]) assert.throws(() => select({ dayOffset }), /invalidOffset/);
  assert.throws(() => select({ view: 'unknown' }), /invalidView/);
  assert.throws(() => selectMap([], defaults), /catalogFailed/);
});
test('every bundled map has a real image and complete, independent provenance', async () => {
  assert.equal(new Set(maps.map(m => m.id)).size, maps.length);
  for (const map of maps) {
    assert.ok((await stat(new URL(map.image, root))).size > 10000, map.id);
    assert.equal(createHash('sha256').update(await readFile(new URL(map.image, root))).digest('hex'), map.sha256);
    assert.match(map.sourceUrl, /^https:\/\/www\.loc\.gov\/item\/\d+\/$/);
    assert.equal(map.rightsUrl, map.sourceUrl + '#rights-and-access');
    assert.ok(map.contributors.length && map.originalTitle && map.year && map.downloadUrl && map.modifications);
    assert.ok(map.de.title && map.en.title && map.de.description && map.en.description);
    assert.equal(map.credit, 'Library of Congress, Geography and Map Division');
  }
});
