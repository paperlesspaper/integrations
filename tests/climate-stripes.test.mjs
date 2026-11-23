import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectChart, styles } from '../applications/climate-stripes/data/selection.js';
const rows = JSON.parse(await readFile(new URL('../applications/climate-stripes/data/locations.json', import.meta.url)));

test('all catalog locations have four valid original charts and unique IDs', () => {
  assert.ok(rows.length > 1000);
  assert.equal(new Set(rows.map(r=>r.id)).size, rows.length);
  for (const row of rows) for (const style of Object.keys(styles)) {
    const chart = selectChart(rows, { location:row.id, style });
    assert.equal(new URL(chart.imageUrl).origin, 'https://showyourstripes.info');
    assert.ok(Number(chart.start) <= Number(chart.end));
  }
});
test('country and city selection keeps the correct series and chart style', () => {
  const germany = rows.find(r=>r.country==='Germany' && r.location.includes('All of'));
  const berlin = rows.find(r=>r.country==='Germany' && r.location==='Berlin');
  assert.ok(germany); assert.ok(berlin);
  assert.match(selectChart(rows,{location:germany.id,style:'bars-scale'}).imageUrl, /barslabel\.png$/);
  assert.match(selectChart(rows,{location:berlin.id,style:'labelled'}).imageUrl, /Berlin.*withlabels\.png$/);
});
test('invalid settings fail rather than silently showing another location', () => {
  assert.throws(()=>selectChart(rows,{location:'missing',style:'stripes'}), /location/);
  assert.throws(()=>selectChart(rows,{location:'globe',style:'toString'}), /style/);
});
