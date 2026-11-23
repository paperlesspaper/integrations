import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadDepartures } from '../applications/sbb-abfahrten/api/data.js';

const port = Number(process.env.DEPARTURE_TEST_PORT || 4366);
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server/index.js'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)), env: { ...process.env, PORT: String(port) }, stdio: 'ignore',
});
process.on('exit', () => server.kill());
let browser;
try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(`${base}/health`)).ok) break; } catch {}
    if (attempt >= 60) throw Error('Local server failed to start');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let fixture = await loadDepartures({ sampleData: true, limit: 12 });
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (/\/(sbb-abfahrten|deutsche-bahn-abfahrten)\/api\/data$/.test(request.url())) request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) });
    else request.continue();
  });
  async function update(settings, language = 'de') {
    await page.evaluate(({ settings, language }) => {
      document.querySelector('#website-has-loaded')?.remove();
      window.postMessage({ type: 'INIT', data: { meta: { language, pluginSettings: settings } } }, '*');
    }, { settings, language });
    await page.waitForSelector('#website-has-loaded');
  }
  async function check() {
    const problems = await page.evaluate(() => {
      const problems = [];
      for (const el of document.querySelectorAll('#app, header, .hero, .board, footer, .empty')) {
        const r = el.getBoundingClientRect();
        if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2 || r.bottom > innerHeight + 1 || r.right > innerWidth + 1) problems.push({ class: el.className, height: [el.scrollHeight, el.clientHeight], width: [el.scrollWidth, el.clientWidth] });
      }
      const visible = [...document.querySelectorAll('.row:not([hidden])')];
      const board = document.querySelector('.board')?.getBoundingClientRect();
      if (visible.some(el => el.getBoundingClientRect().bottom > board.bottom + 1)) problems.push('Clipped row');
      return problems;
    });
    assert.deepEqual(problems, []);
  }
  for (const slug of ['sbb-abfahrten', 'deutsche-bahn-abfahrten']) {
  fixture = await loadDepartures({ sampleData: true, limit: 12 });
  fixture.departures[1].direction = 'Niederweningen';
  if (slug === 'deutsche-bahn-abfahrten') { fixture.station.name = 'Berlin Hbf'; fixture.departures[2].cancelled = true; }
  for (const [width, height] of [[800,480], [480,800], [1600,1200], [1200,1600]]) {
    await page.setViewport({ width, height });
    await page.goto(`${base}/${slug}/render.html`);
    await page.waitForSelector('#website-has-loaded');
    for (const language of (slug === 'deutsche-bahn-abfahrten' ? ['de', 'en', 'fr', 'it', 'es'] : ['de', 'en', 'fr', 'it'])) {
      for (const color of ['red-light', 'blue-dark', 'green-light', 'red-dark', 'dark']) {
        await update({ color }, language);
        await check();
        const counts = await page.evaluate(() => ({ visible: document.querySelectorAll('.row:not([hidden])').length, more: document.querySelector('.more').textContent }));
        const missing = fixture.departures.length - 1 - counts.visible + fixture.more;
        if (missing) assert.ok(counts.more.includes(String(missing)));
      }
    }
  }
  await page.setViewport({ width: 800, height: 480 });
  fixture.station.name = 'Niederweningen';
  fixture.departures[0].direction = 'Niederweningen';
  await update({ color: 'red-light' });
  for (const selector of ['h1', '.hero h2', '.destination']) {
    const el = await page.$(selector);
    const box = await el.boundingBox();
    const clip = { x: Math.floor(box.x)-2, y: Math.floor(box.y)-3, width: Math.ceil(box.width)+4, height: Math.ceil(box.height)+6 };
    const clipped = await page.screenshot({ clip });
    await el.evaluate(node => node.style.overflow = 'visible');
    const unclipped = await page.screenshot({ clip });
    assert.deepEqual(clipped, unclipped, `${slug}: glyph ink was clipped in ${selector}`);
    await el.evaluate(node => node.style.removeProperty('overflow'));
  }
  // Resizing must restore previously omitted rows.
  await page.setViewport({ width: 480, height: 800 });
  await check();
  fixture = structuredClone(fixture);
  fixture.station.name = '<img src=x onerror=alert(1)> ' + 'A long station name '.repeat(6);
  fixture.departures[0].direction = '<img src=x onerror=alert(1)> ' + 'A long destination '.repeat(6);
  for (const [width, height] of [[800,480], [480,800]]) {
    await page.setViewport({ width, height });
    await update({ color: 'blue-dark', showPlatformChanges: false });
    await check();
    assert.equal(await page.$('h1 img, h2 img'), null);
    assert.equal(await page.$('.changed'), null);
  }
  fixture.departures = []; fixture.more = 0;
  await update({ color: 'green-light' }, 'fr'); await check();
  assert.equal(await page.$('.hero'), null);
  for (const error of ['upstream', 'station']) {
    fixture = { error };
    await update({ color: 'red-light' }); await check();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.paperlessRenderStatus), 'error');
    assert.equal(await page.$('.hero'), null);
  }
  }
  assert.deepEqual(errors, []);
  console.log('DB/SBB: 180 language/theme/viewport combinations, glyph-pixel comparisons, long escaped text, empty and error states passed.');
} finally { await browser?.close(); server.kill(); }
