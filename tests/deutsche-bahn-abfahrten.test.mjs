import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../applications/deutsche-bahn-abfahrten/api/data.js';

const query = { stationName: 'Karlsruhe Hbf', stationId: '8000191', products: 'nationalExpress', duration: 180 };
const train = (clock, extra = {}) => ({ scheduledDeparture: clock, train: 'ICE 103', trainClasses: ['F'], destination: 'Basel SBB', delayDeparture: 0, ...extra });
function mockFallback(t, now, departures, inspect = () => {}) {
  t.mock.method(Date, 'now', () => Date.parse(now));
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.hostname === 'v6.db.transport.rest') throw new Error('Primary unavailable');
    inspect(url);
    return { ok: true, json: async () => ({ departures }) };
  });
}

for (const tz of ['UTC', 'Europe/Berlin', 'America/Los_Angeles']) {
  test(`German clock times remain correct on a ${tz} server`, async (t) => {
    const previous = process.env.TZ;
    process.env.TZ = tz;
    t.after(() => { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; });
    mockFallback(t, '2026-09-18T08:43:00Z', [train('11:01'), train('11:26'), train('12:01')]);
    const result = await handler({ query });
    assert.deepEqual(result.departures.map(d => d.when), ['2026-09-18T09:01:00.000Z', '2026-09-18T09:26:00.000Z', '2026-09-18T10:01:00.000Z']);
  });
}

test('fallback filters both window boundaries and cancellations before sorting and limiting', async (t) => {
  mockFallback(t, '2026-09-18T08:43:00Z', [train('12:00'), train('10:42'), train('10:43'), train('10:45', { isCancelled: 1 }), train('10:44'), train('13:44'), train('bad')]);
  const result = await handler({ query: { ...query, showCancelled: false, limit: 2 } });
  assert.deepEqual(result.departures.map(d => d.when), ['2026-09-18T08:43:00.000Z', '2026-09-18T08:44:00.000Z']);
});

for (const [now, clock, delay, expected] of [
  ['2026-01-18T09:43:00Z', '11:01', 0, '2026-01-18T10:01:00.000Z'],
  ['2026-09-18T21:55:00Z', '00:05', 0, '2026-09-18T22:05:00.000Z'],
  ['2026-09-18T22:05:00Z', '23:55', 20, '2026-09-18T22:15:00.000Z'],
  ['2026-03-29T00:55:00Z', '03:05', 0, '2026-03-29T01:05:00.000Z'],
  ['2026-10-25T01:05:00Z', '02:15', 0, '2026-10-25T01:15:00.000Z'],
]) {
  test(`fallback handles winter, midnight and DST: ${now} / ${clock}`, async (t) => {
    mockFallback(t, now, [train(clock, { delayDeparture: delay })]);
    const result = await handler({ query });
    assert.equal(result.departures[0]?.when, expected);
  });
}

test('fallback requests station ID and literal destination through upstream route filtering', async (t) => {
  mockFallback(t, '2026-09-18T08:43:00Z', [train('11:01', { destination: 'Zürich HB' })], (url) => {
    assert.equal(url.pathname, '/8000191.json');
    assert.equal(url.searchParams.get('version'), '3');
    assert.equal(url.searchParams.get('via'), 'Basel SBB');
  });
  const result = await handler({ query: { ...query, destination: 'Basel SBB' } });
  assert.equal(result.departures[0].direction, 'Zürich HB');
});

test('primary sends product and destination filters before limiting; sorts and bounds realtime departures', async (t) => {
  t.mock.method(Date, 'now', () => Date.parse('2026-09-18T08:43:00Z'));
  const departure = (when, extra = {}) => ({ when, line: { name: 'ICE 103', product: 'nationalExpress' }, ...extra });
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.pathname === '/locations') {
      assert.equal(url.searchParams.get('query'), 'Basel SBB');
      return { ok: true, json: async () => [{ id: '8500010', name: 'Basel SBB' }] };
    }
    assert.equal(url.searchParams.get('direction'), '8500010');
    assert.equal(url.searchParams.get('nationalExpress'), 'true');
    assert.equal(url.searchParams.get('regional'), 'false');
    assert.equal(url.searchParams.has('results'), false);
    assert.equal(url.searchParams.get('when'), '2026-09-18T08:43:00.000Z');
    return { ok: true, json: async () => ({ departures: [
      departure('2026-09-18T10:01:00Z'), departure('2026-09-18T08:42:00Z'),
      departure('2026-09-18T09:00:00Z', { cancelled: true }),
      departure('2026-09-18T09:01:00Z'), departure('2026-09-18T12:00:00Z'),
    ] }) };
  });
  const result = await handler({ query: { ...query, destination: 'Basel SBB', limit: 1, showCancelled: false } });
  assert.equal(result.source, 'v6.db.transport.rest');
  assert.equal(result.departures[0].when, '2026-09-18T09:01:00Z');
});
