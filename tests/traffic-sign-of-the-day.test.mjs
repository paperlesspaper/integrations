import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { germanDay, selectSign } from '../applications/traffic-sign-of-the-day/data/selection.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = path.join(root, 'applications/traffic-sign-of-the-day');
const signs = JSON.parse(await fs.readFile(path.join(folder, 'data/signs.json'), 'utf8'));
const config = JSON.parse(await fs.readFile(path.join(folder, 'config.json'), 'utf8'));

test('rotation follows German midnight and remains stable through daylight saving changes', () => {
  assert.equal(germanDay(new Date('2026-09-22T21:59:59Z')), '2026-09-22');
  assert.equal(germanDay(new Date('2026-09-22T22:00:00Z')), '2026-09-23');
  for (const day of ['2026-03-29', '2026-10-25']) {
    const a = selectSign(signs, '', new Date(`${day}T01:00:00Z`));
    const b = selectSign(signs, '', new Date(`${day}T20:00:00Z`));
    assert.equal(a.sign.id, b.sign.id);
  }
  const cycle = Array.from({ length: signs.length }, (_, i) => selectSign(signs, '', new Date(Date.UTC(2026, 8, 22 + i, 12))).sign.id);
  assert.equal(new Set(cycle).size, signs.length);
  assert.equal(selectSign(signs, '', new Date(Date.UTC(2026, 8, 22 + signs.length, 12))).sign.id, cycle[0]);
  assert.equal(selectSign(signs, '206', new Date('2027-01-01')).sign.id, '206');
  assert.throws(() => selectSign(signs, 'missing'), /Unbekanntes/);
  assert.throws(() => selectSign([]), /leer/);
});

test('each selectable sign has local artwork, complete copy and traceable sources', async () => {
  const sources = JSON.parse(await fs.readFile(path.join(folder, 'assets/sources.json'), 'utf8'));
  assert.equal(new Set(signs.map(s => s.id)).size, signs.length);
  assert.deepEqual(sources.map(source => source.id).sort(), signs.map(sign => sign.id).sort());
  assert.deepEqual(config.formSchema.properties.signId.enum, ['', ...signs.map(s => s.id)]);
  assert.deepEqual(config.formSchema.properties.signId.enumNames, ['Täglich wechselnd', ...signs.map(s => `${s.id} · ${s.name}`)]);
  for (const sign of signs) {
    for (const field of ['name', 'officialName', 'meaning', 'behavior', 'detail']) assert.ok(sign[field]?.trim(), `${sign.id}: ${field}`);
    if (sign.category === 'additional') {
      assert.equal(sign.annex, null);
      assert.ok(sign.references.includes('__39.html'));
      assert.equal(sign.sourceLabel, 'StVO · § 39');
    } else {
      assert.ok([1, 2, 3].includes(sign.annex));
      assert.ok(sign.references.includes(`anlage_${sign.annex}.html`));
    }
    const credit = sources.find(source => source.id === sign.id);
    assert.equal(credit?.license, 'public domain');
    assert.equal(credit.title, sign.artwork);
    assert.equal(credit.file, `./assets/${sign.id}.svg`);
    const svg = await fs.readFile(path.join(folder, `assets/${sign.id}.svg`), 'utf8');
    assert.match(svg, /<svg\b/);
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b|(?:xlink:)?href\s*=\s*["']https?:/i);
    // Original traffic-sign blue can quantize to black on Spectra 6.
    assert.doesNotMatch(svg, /#154889|#c1121c|#f7ba0b/i);
    if (['283', '286', '308', '220-20', '314', '325.1', '327'].includes(sign.id)) assert.match(svg, /#0000ff/i);
  }
});

test('shared daily-card layout fits the catalog, themes, controls and repeated INIT updates', { timeout: 180000 }, async () => {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const file = url.pathname.startsWith('/assets/')
        ? path.join(root, 'public', url.pathname.slice(8))
        : path.join(folder, url.pathname.replace(/^\/traffic-sign-of-the-day\//, ''));
      res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
      res.end(await fs.readFile(file));
    } catch { res.statusCode = 404; res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/traffic-sign-of-the-day/render.html`);
    await page.waitForSelector('#website-has-loaded');
    let cases = 0;
    for (const [width, height] of [[800, 480], [480, 800], [1600, 1200], [1200, 1600]]) {
      await page.setViewport({ width, height });
      const variants = signs.flatMap(sign => ['small', 'middle', 'big'].map(textSize => ({ signId: sign.id, textSize })));
      for (const color of ['light', 'dark', 'blue-light', 'blue-dark', 'red-light', 'green-dark']) {
        for (const textSize of ['small', 'middle', 'big']) variants.push({ signId: '286', color, textSize });
      }
      variants.push(
        { showHeader: false },
        { showMeaning: false, showBehavior: false, showDetail: false },
        { showHeader: false, showMeaning: false, showBehavior: false, showDetail: false },
        { textSize: 'big', showFactCount: true },
        { showRotationCount: true },
        { textSize: 'big', showFactCount: true, showRotationCount: true },
        { showHeader: false, showFactCount: true, showRotationCount: true },
      );
      for (const variant of variants) {
        const settings = { ...config.nativeSettings, ...variant };
        await page.evaluate(settings => {
          window.PaperlessOpenIntegration.markLoading();
          window.postMessage({ type: 'INIT', data: { meta: { language: 'de', pluginSettings: settings } } }, '*');
        }, settings);
        await page.waitForSelector('#website-has-loaded', { timeout: 10000 });
        const issues = await page.evaluate(settings => {
          const root = document.querySelector('.pp-otd-screen');
          const issues = [];
          if (!root?.querySelector('.pp-otd-image-stage')) return [document.querySelector('#app').textContent];
          const visible = el => Boolean(el && el.getClientRects().length);
          for (const el of root.querySelectorAll('*')) {
            if (!visible(el)) continue;
            const r = el.getBoundingClientRect();
            if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) issues.push(`Overflow: ${el.className}`);
            if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) issues.push(`Outside: ${el.className}`);
          }
          const stage = root.querySelector('.pp-otd-image-stage').getBoundingClientRect();
          const img = root.querySelector('img');
          const box = img.getBoundingClientRect();
          if (!img.naturalWidth || box.left < stage.left - 1 || box.top < stage.top - 1 || box.right > stage.right + 1 || box.bottom > stage.bottom + 1) issues.push('Image outside its stage');
          const regions = [...root.querySelectorAll('.pp-otd-header,.pp-otd-image-stage,.pp-otd-fact-grid,.pp-otd-footer')].filter(visible);
          for (let i = 0; i < regions.length; i++) for (let j = i + 1; j < regions.length; j++) {
            const a = regions[i].getBoundingClientRect(), b = regions[j].getBoundingClientRect();
            if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) issues.push('Overlapping regions');
          }
          const facts = [...root.querySelectorAll('.pp-otd-fact')];
          const shown = facts.filter(visible).length;
          const counter = root.querySelector('.pp-otd-facts-shown');
          if (visible(counter) !== (settings.showFactCount && shown < facts.length)) issues.push('Fact counter visibility');
          if (Boolean(visible(root.querySelector('[data-key="rotation"]'))) !== (settings.showRotationCount && settings.showHeader)) issues.push('Rotation counter visibility');
          if (!settings.showMeaning && !settings.showBehavior && !settings.showDetail && facts.length) issues.push('Deselected facts restored');
          if (settings.textSize === 'middle' && settings.showHeader && settings.showMeaning && settings.showBehavior && settings.showDetail && shown !== 3) issues.push('Default text must show all three explanations');
          if (settings.signId && !img.getAttribute('src').endsWith(`/${settings.signId}.svg`)) issues.push('Wrong pinned sign');
          if (settings.showHeader && /^\d{4}-/.test(settings.signId)) {
            const footer = root.querySelector('.pp-otd-footer')?.textContent || '';
            if (!footer.includes('StVO · § 39') || footer.includes('Anlage null')) issues.push('Wrong source for additional sign');
          }
          return issues;
        }, settings);
        assert.deepEqual(issues, [], `${width}x${height} ${JSON.stringify(variant)}`);
        cases++;
      }
    }
    assert.deepEqual(errors, []);
    console.log(`Verified ${cases} display/settings combinations with the installed shared renderer.`);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
