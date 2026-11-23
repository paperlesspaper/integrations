import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../applications/quote/api/data.js';
for (const value of [undefined, null, '', ' ', 'null', false, []]) {
  test(`unset/non-numeric index ${JSON.stringify(value)} rotates daily`, async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-29T00:00:00Z') });
    const first = await handler({ query: { index: value } });
    t.mock.timers.tick(86_400_000);
    assert.notEqual((await handler({ query: { index: value } })).quote, first.quote);
  });
}
for (const value of [0, '0', 7, '7']) {
  test(`explicit index ${JSON.stringify(value)} stays fixed`, async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-29T00:00:00Z') });
    const first = await handler({ query: { index: value } });
    t.mock.timers.tick(86_400_000);
    assert.equal((await handler({ query: { index: value } })).quote, first.quote);
    if (Number(value) === 0) assert.equal(first.quote, 'The secret of getting ahead is getting started.');
  });
}
test('serialized empty setting rotates at UTC midnight and stays stable within the day', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-29T00:00:00Z') });
  const query = Object.fromEntries(new URLSearchParams({ index: '' }));
  const morning = await handler({ query });
  t.mock.timers.tick(86_399_999);
  assert.equal((await handler({ query })).quote, morning.quote);
  t.mock.timers.tick(1);
  assert.notEqual((await handler({ query })).quote, morning.quote);
});
