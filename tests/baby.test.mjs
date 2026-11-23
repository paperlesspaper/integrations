import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { parseDate, calendarAge, addMonths, dateInZone, getBabyState, illustrationFor, dailyCard } from '../applications/baby/data/model.js';
const data = JSON.parse(readFileSync(new URL('../applications/baby/data/development.json', import.meta.url)));
const day = parseDate;
const state = (s, now = '2026-09-22') => getBabyState(s, data, now);
test('strict civil dates reject rollover, timestamps and missing values', () => {
  for (const value of ['', null, '2026-02-30', '2025-02-29', '2026-1-01', '2026-01-01T00:00:00Z']) assert.equal(day(value), null);
  assert.notEqual(day('2024-02-29'), null);
});
test('calendar months use anniversaries with month-end clamping, not 30-day buckets', () => {
  assert.deepEqual(calendarAge(day('2026-01-31'), day('2026-02-28')), { months: 1, days: 0, totalDays: 28 });
  assert.equal(calendarAge(day('2026-01-31'), day('2026-03-30')).months, 1);
  assert.equal(calendarAge(day('2024-02-29'), day('2025-02-28')).months, 12);
  assert.equal(calendarAge(day('2026-03-29'), day('2026-03-30')).totalDays, 1);
});
test('Berlin date rolls over correctly around UTC midnight and DST', () => {
  assert.equal(dateInZone(new Date('2026-09-21T22:30:00Z')), '2026-09-22');
  assert.equal(dateInZone(new Date('2026-03-28T23:30:00Z')), '2026-03-29');
});
test('pregnancy uses 280 days and completed weeks, with no automatic birth', () => {
  const dueDate = '2026-09-22';
  assert.equal(state({ dueDate }).week, 40);
  assert.equal(state({ dueDate }).phase, 'pregnancy');
  assert.equal(state({ dueDate }, '2026-09-21').week, 39);
  assert.equal(state({ dueDate }, '2026-09-21').day, 6);
  assert.equal(state({ dueDate }, '2026-10-05').entry.week, 41);
  assert.equal(state({ dueDate }, '2026-10-06').error, 'confirmBirth');
  assert.equal(state({ dueDate: '2027-12-01' }).error, 'dueTooFar');
  const first = state({ dueDate }, '2025-12-16');
  assert.equal(first.week, 0); assert.equal(first.entry.id, 'week-00');
});
test('birth date wins, legacy lowercase birthdate remains a due date', () => {
  assert.equal(state({ birthdate: '2026-09-22' }).phase, 'pregnancy');
  const born = state({ dueDate: '2026-09-25', birthDate: '2026-09-22' });
  assert.equal(born.entry.month, 0); assert.equal(born.age.totalDays, 0);
  assert.equal(state({ birthDate: '2026-09-23' }).error, 'futureBirth');
  assert.equal(state({}).error, 'setup');
  assert.equal(state({ birthDate: 'broken', dueDate: '2026-09-22' }).error, 'invalidBirth');
});
test('every milestone changes only on the exact calendar anniversary', () => {
  const b = day('2020-01-31');
  for (const item of data.child.slice(1)) {
    const date = new Date(addMonths(b, item.month) * 86400000).toISOString().slice(0,10);
    const previous = new Date((addMonths(b,item.month)-1) * 86400000).toISOString().slice(0,10);
    assert.equal(state({ birthDate: '2020-01-31' }, date).entry.month, item.month);
    assert.ok(state({ birthDate: '2020-01-31' }, previous).entry.month < item.month);
  }
  assert.equal(state({ birthDate: '2020-01-31' }, '2026-01-31').error, 'beyondRange');
});
test('prematurity corrects development, preserves actual age, stops at second birthday', () => {
  const s = { birthDate: '2026-03-22', prematureWeeks: 8 };
  const corrected = state(s);
  assert.equal(corrected.age.months, 6);
  assert.equal(corrected.developmentalAge.months, 4);
  assert.equal(corrected.entry.month, 4);
  assert.equal(state(s, '2026-03-23').beforeDue, true);
  assert.equal(state(s, '2028-03-22').corrected, false);
  assert.equal(state(s, '2028-03-22').entry.month, 24);
  for (const v of [-1, 21, 1.5, 'oops']) assert.equal(state({ ...s, prematureWeeks: v }).error, 'invalidCorrection');
});
test('demo, reference dates and string booleans are deterministic', () => {
  assert.equal(state({ demo: 'false' }).error, 'setup');
  assert.equal(state({ demo: true }).entry.month, 6);
  assert.equal(state({ demo: true, demoStage: 'pregnancy' }).week, 24);
  assert.equal(state({ demo: true, demoStage: 'toddler' }).entry.month, 24);
  assert.equal(state({ birthDate: '2026-03-22', referenceDate: '2026-07-22' }).entry.month, 4);
  assert.equal(state({ referenceDate: 'bad' }).error, 'invalidReference');
});
test('all weeks, languages, domains, sources and image assets are present', () => {
  assert.deepEqual(data.pregnancy.map(r=>r.week), [0,...Array.from({length:38},(_,i)=>i+4)]);
  assert.deepEqual(data.child.map(r=>r.month), [0,2,4,6,9,12,15,18,24,30,36,48,60]);
  for(const row of [...data.pregnancy,...data.child]) {
    assert.ok(row.title.de && row.title.en);
    assert.ok(/^https:\/\/(www\.)?(nhs\.uk|cdc\.gov|healthychildren\.org)\//.test(row.source.url));
    assert.ok(existsSync(new URL(`../applications/baby/assets/${row.image}.png`,import.meta.url)));
    assert.ok(existsSync(new URL(`../applications/baby/assets/${row.classicImage}.png`,import.meta.url)));
    if(row.week != null) assert.ok(row.tip.de && row.tip.en);
    if(row.facts) { assert.deepEqual(row.facts.map(f=>f.domain), ['social','language','learning','movement']); assert.ok(row.facts.every(f=>f.de && f.en)); assert.equal(row.tips.de.length, row.tips.en.length); }
  }
  assert.equal(data.pregnancy.find(r=>r.week===19).measurement,'crl');
  assert.equal(data.pregnancy.find(r=>r.week===20).measurement,'headHeel');
  const de=JSON.parse(readFileSync(new URL('../applications/baby/languages/de.json',import.meta.url)));
  const en=JSON.parse(readFileSync(new URL('../applications/baby/languages/en.json',import.meta.url)));
  assert.deepEqual(Object.keys(de).sort(),Object.keys(en).sort());
});
test('pregnancy previews cover all weeks and ignore the preview week outside demo mode', () => {
  for(let week=0;week<=41;week++) {
    const s=state({demo:true,demoStage:'pregnancy',demoPregnancyWeek:String(week)});
    assert.equal(s.week,week);
    assert.equal(s.entry.week,week<4?0:week);
    assert.equal(s.phase,'pregnancy');
  }
  for(const value of [-1,42,2.5,'bad']) assert.equal(state({demo:true,demoStage:'pregnancy',demoPregnancyWeek:value}).week,24);
  assert.equal(state({dueDate:'2026-09-22',demoPregnancyWeek:12}).week,40);
});
test('image style changes only the asset, and prenatal images never select a future stage', () => {
  for(const item of [...data.pregnancy,...data.child]) {
    assert.equal(illustrationFor(item,'classic'),item.classicImage);
    assert.equal(illustrationFor(item,'illustrated'),item.image);
    assert.equal(illustrationFor(item,'../../bad'),item.image);
    if(item.imageWeek != null) assert.ok(item.imageWeek<=item.week);
  }
  assert.equal(illustrationFor(null,'classic'),'classic-newborn');
  for(const week of [6,8,10,12,16,20,24,28,32,36,40]) {
    const selected=state({demo:true,demoStage:'pregnancy',demoPregnancyWeek:week}).entry;
    const previous=state({demo:true,demoStage:'pregnancy',demoPregnancyWeek:week-1}).entry;
    assert.equal(selected.imageWeek,week);
    assert.ok(previous.imageWeek<week);
  }
});
test('every daily card is bilingual, unique within its phase and linked to the parent source', () => {
  const ids = new Set();
  for (const entry of [...data.pregnancy,...data.child]) {
    assert.equal(entry.daily.length, entry.week === 0 ? 2 : entry.week != null ? 7 : 13);
    assert.ok(entry.source.url.startsWith('https://'));
    for (const lang of ['de','en']) {
      assert.equal(new Set(entry.daily.map(c=>c.text[lang])).size,entry.daily.length);
      for (const card of entry.daily) assert.ok(card.title[lang] && card.text[lang]);
    }
    for (const card of entry.daily) {
      assert.ok(!ids.has(card.id)); ids.add(card.id);
      assert.ok(['knowledge','milestone','overview','activity'].includes(card.kind));
    }
  }
  assert.equal(ids.size,437);
});
test('daily pregnancy rotation covers seven consecutive civil days and changes at the week boundary', () => {
  const dueDate='2026-09-22';
  const iso=d=>new Date(d*86400000).toISOString().slice(0,10);
  for (let week=4;week<=41;week++) {
    const entries=Array.from({length:7},(_,i)=>state({dueDate},iso(day(dueDate)-280+week*7+i)));
    assert.equal(new Set(entries.map(s=>s.daily.id)).size,7);
    assert.ok(entries.every(s=>s.entry.week===week));
    assert.deepEqual(entries.map(s=>s.daily),data.pregnancy.find(e=>e.week===week).daily);
  }
});
test('child content rotates deterministically, repeats honestly, and preserves reference age', () => {
  const birthDate='2026-01-15';
  const first=state({birthDate},'2026-03-15');
  assert.equal(first.entry.month,2);
  assert.equal(first.daily.id,'month-02-daily-01');
  assert.equal(state({birthDate},'2026-03-28').daily.id,first.daily.id);
  assert.notEqual(state({birthDate},'2026-03-29').daily.id,state({birthDate},'2026-03-30').daily.id);
  assert.equal(state({birthDate},'2026-04-15').entry.month,2);
  assert.equal(state({birthDate},'2026-05-15').daily.id,'month-04-daily-01');
  for (const e of [...data.pregnancy,...data.child]) {
    for (let i=-30;i<30;i++) assert.notEqual(dailyCard(e,i,false).kind,'activity');
  }
  assert.notEqual(state({birthDate,showTip:'false'},'2026-03-16').daily.kind,'activity');
});
test('intermediate pictures never advance milestone ages, and use corrected calendar age', () => {
  const iso=d=>new Date(d*86400000).toISOString().slice(0,10);
  for (const art of data.childIllustrations) {
    for(const key of ['image','classicImage']) assert.ok(existsSync(new URL(`../applications/baby/assets/${art[key]}.png`,import.meta.url)));
    const date=addMonths(day('2020-01-15'),art.month);
    const s=state({birthDate:'2020-01-15'},iso(date));
    assert.equal(s.illustration.month,art.month);
    assert.ok(s.entry.month<=art.month);
    if(art.month) assert.ok(state({birthDate:'2020-01-15'},iso(date-1)).illustration.month<art.month);
  }
  const s=state({birthDate:'2026-01-15',prematureWeeks:8},'2026-06-12');
  assert.equal(s.developmentalAge.months,3);
  assert.equal(s.entry.month,2);
  assert.equal(s.illustration.month,3);
  assert.equal(s.daily.id,'month-02-daily-06');
});
