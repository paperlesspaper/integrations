import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { loadDepartures, normalizeDeparture, normalizeBoard, settingsFor } from '../applications/sbb-abfahrten/api/data.js';

const now = Date.parse('2026-10-06T06:30:00Z');
const journey = (overrides = {}) => ({ category: 'IC', number: '1', name: 'IC101', operator: 'SBB', to: 'Genève-Aéroport',
  stop: { departure: '2026-10-06T08:32:00+0200', delay: null, platform: '31', prognosis: {} },
  passList: [{ station: { name: 'Zürich HB' } }, { station: { name: 'Bern' } }, { station: { name: 'Lausanne' } }], ...overrides });
const board = rows => ({ station: { id: '8503000', name: 'Zürich HB' }, stationboard: rows });

test('scheduled departures retain unknown delay; forecasts and platform changes are explicit', () => {
  assert.equal(normalizeDeparture(journey()).delayMinutes, null);
  const row = normalizeDeparture(journey({ stop: { departure: '2026-10-06T08:32:00+0200', delay: 9, platform: '31', prognosis: { departure: '2026-10-06T08:35:00+0200', platform: '32' } } }));
  assert.equal(row.delayMinutes, 3);
  assert.equal(row.when, '2026-10-06T06:35:00.000Z');
  assert.equal(row.plannedWhen, '2026-10-06T06:32:00.000Z');
  assert.equal(row.platformChanged, true);
  assert.equal(row.platform, '32');
  for (const delay of [null, undefined, '', ' ', false, 'unknown']) {
    assert.equal(normalizeDeparture(journey({ stop: { departure: '2026-10-06T08:32:00+0200', delay } })).delayMinutes, null);
  }
  assert.equal(normalizeDeparture(journey({ stop: { departure: 'invalid' } })), null);
  assert.equal(normalizeDeparture(null), null);
  assert.equal(normalizeDeparture(journey({ stop: { departure: '2026-10-06T08:32:00+0200', delay: 1e100 } })), null);
});

test('reported delays work without a forecast and preserve midnight/DST offsets', () => {
  for (const [departure, delay, expected] of [
    ['2026-10-06T23:59:00+0200', 4, '2026-10-06T22:03:00.000Z'],
    ['2026-10-25T02:59:00+0200', 4, '2026-10-25T01:03:00.000Z'],
    ['2026-10-25T02:59:00+0100', 4, '2026-10-25T02:03:00.000Z'],
    ['2026-10-06T08:35:00+0200', -2, '2026-10-06T06:33:00.000Z'],
  ]) assert.equal(normalizeDeparture(journey({ stop: { departure, delay } })).when, expected);
});

test('filter before limiting, sort by expected time, omit past/outside-window/malformed and duplicate journeys', () => {
  const delayed = journey({ stop: { departure: '2026-10-06T08:28:00+0200', delay: 10 } });
  const rows = [delayed, journey(), journey(), null,
    journey({ stop: { departure: '2026-10-06T08:20:00+0200' } }),
    journey({ stop: { departure: '2026-10-06T10:20:00+0200' } })];
  const result = normalizeBoard(board(rows), settingsFor({ limit: 1 }), now);
  assert.equal(result.departures.length, 1);
  assert.equal(result.departures[0].when, '2026-10-06T06:32:00.000Z');
  assert.equal(result.more, 1);
  assert.equal(normalizeBoard(board(rows), settingsFor({ destination: 'BERN', lines: 'S12,IC1' }), now).departures.length, 2);
  assert.equal(normalizeBoard(board(rows), settingsFor({ destination: 'geneve' }), now).departures.length, 2);
  assert.equal(normalizeBoard(board(rows), settingsFor({ destination: 'Zürich HB' }), now).departures.length, 0);
  assert.equal(normalizeBoard(board(rows), settingsFor({ lines: 'IC 10' }), now).departures.length, 0);
});

test('bounded timetable coverage, empty responses and malformed upstream responses stay distinct', () => {
  assert.equal(normalizeBoard(board([]), settingsFor(), now).departures.length, 0);
  assert.equal(normalizeBoard(board(Array.from({ length: 100 }, () => journey())), settingsFor(), now).partial, true);
  for (const invalid of [{}, { stationboard: [] }, board(null), { ...board([]), errors: ['no station'] }]) {
    assert.throws(() => normalizeBoard(invalid, settingsFor(), now), /upstream/);
  }
});

test('requests use the fixed Swiss endpoint, station-ID precedence, transport filter and 30-second cache', async () => {
  const result = await loadDepartures({ stationName: 'ignored', stationId: '8507000', transport: 'train', limit: 100, duration: 999 }, async (url, options) => {
    const u = new URL(url);
    assert.equal(u.origin, 'https://transport.opendata.ch');
    assert.equal(u.pathname, '/v1/stationboard');
    assert.equal(u.searchParams.get('id'), '8507000');
    assert.equal(u.searchParams.has('station'), false);
    assert.equal(u.searchParams.get('transportations[]'), 'train');
    assert.equal(u.searchParams.get('limit'), '100');
    assert.equal(options.ttl, 30000);
    assert.ok(options.maxBytes <= 4 * 1024 * 1024);
    return board([]);
  }, now);
  assert.equal(result.sample, false);
  assert.equal(result.duration, 360);
  await loadDepartures({ stationName: 'Bern, Bahnhof & Test', transport: 'https://evil.test' }, async url => {
    assert.equal(new URL(url).searchParams.get('station'), 'Bern, Bahnhof & Test');
    assert.equal(new URL(url).searchParams.has('transportations[]'), false);
    return board([]);
  }, now);
});

test('live errors never become examples, and sample mode is explicit and offline', async () => {
  const never = () => { throw Error('network failed'); };
  await assert.rejects(loadDepartures({ sampleData: 'false' }, never), /network failed/);
  const demo = await loadDepartures({ sampleData: 'true' }, never);
  assert.equal(demo.sample, true);
  assert.equal(demo.departures[0].platformChanged, true);
  assert.equal(demo.departures[0].delayMinutes, 3);
  assert.deepEqual(await handler({ query: { stationId: 'https://invalid' } }), { error: 'station' });
  assert.equal(settingsFor({ limit: 100 }).limit, 12);
});
