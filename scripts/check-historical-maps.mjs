import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'output/historical-maps');
await fs.mkdir(output, { recursive: true });
const maps = JSON.parse(await fs.readFile(path.join(root, 'applications/historical-maps/data/maps.json')));
const config = JSON.parse(await fs.readFile(path.join(root, 'applications/historical-maps/config.json')));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const shared = url.pathname.startsWith('/assets/');
    const base = path.join(root, shared ? 'public' : 'applications');
    const filename = path.resolve(base, '.' + (shared ? url.pathname.slice(7) : url.pathname));
    if (!filename.startsWith(base + path.sep)) throw Error('Invalid path');
    res.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
    res.end(await fs.readFile(filename));
  } catch { res.statusCode = 404; res.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
let count = 0;
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const cases = maps.flatMap(map => ['de', 'en'].map(language => ({ name: map.id + '-' + language, language, mapId: map.id })));
  cases.push(...['blue-light', 'green-dark', 'dark'].flatMap(color => ['detail', 'complete'].map(view => ({ name: color + '-' + view, color, view, mapId: 'yellowstone-1878', language: 'de' }))));
  cases.push({ name: 'minimal', mapId: 'paris-1878', showDescription: false, language: 'en' });
  for (const testCase of cases) for (const [width, height] of [[800, 480], [480, 800], [1600, 1200], [1200, 1600]]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${server.address().port}/historical-maps/render.html`, { waitUntil: 'networkidle0' });
    const settings = { ...config.nativeSettings, ...testCase };
    await page.evaluate(data => window.postMessage({ type: 'INIT', data }, '*'), { meta: { language: testCase.language, pluginSettings: settings } });
    await page.waitForFunction(id => document.documentElement.dataset.paperlessRenderStatus === 'ready' && document.querySelector('.map-image')?.src.includes(id), {}, settings.mapId);
    const issues = await page.evaluate(() => {
      const issues = [];
      for (const el of document.querySelectorAll('#app, #app *')) {
        if (!el.getClientRects().length) continue;
        const box = el.getBoundingClientRect();
        if (box.x < -1 || box.y < -1 || box.right > innerWidth + 1 || box.bottom > innerHeight + 1) issues.push(`outside: ${el.className}`);
        if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) issues.push(`overflow: ${el.className}`);
      }
      const image = document.querySelector('.map-image');
      if (!image.complete || !image.naturalWidth) issues.push('image missing');
      if (document.querySelector('.map-stage').clientHeight < innerHeight * 0.35) issues.push('map too small');
      if (!document.querySelector('.source-line a').href.startsWith('https://www.loc.gov/item/')) issues.push('source link missing');
      return issues;
    });
    assert.deepEqual(issues, [], `${testCase.name} ${width}x${height}`);
    await page.screenshot({ path: path.join(output, `${testCase.name}-${width}x${height}-raw.png`) });
    count++;
  }
  // Back-to-back INIT changes must leave only the last request on screen.
  await page.evaluate(() => {
    for (const id of ['yellowstone-1878', 'east-asia-1873', 'paris-1878']) window.postMessage({ type: 'INIT', data: { meta: { language: 'en', pluginSettings: { mapId: id, color: 'green-dark' } } } }, '*');
  });
  await page.waitForFunction(() => document.documentElement.dataset.paperlessRenderStatus === 'ready' && document.querySelector('.map-image')?.src.includes('paris-1878') && document.body.classList.contains('green-dark'));
  await page.evaluate(() => window.postMessage({ type: 'INIT', data: { meta: { pluginSettings: { mapId: 'missing' } } } }, '*'));
  await page.waitForFunction(() => document.documentElement.dataset.paperlessRenderStatus === 'error');
  assert.ok(await page.$('[role="alert"]'));
  // A real failed image request must produce an error rather than a ready blank map.
  await page.setRequestInterception(true);
  page.on('request', request => request.url().endsWith('yellowstone-1878.jpg') ? request.abort() : request.continue());
  await page.setCacheEnabled(false);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.evaluate(() => window.postMessage({ type: 'INIT', data: { meta: { pluginSettings: { mapId: 'yellowstone-1878' } } } }, '*'));
  await page.waitForFunction(() => document.documentElement.dataset.paperlessRenderStatus === 'error');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.paperlessRenderError), 'imageFailed');
  assert.deepEqual(errors, []);
  console.log(`${count} layouts passed; INIT race, invalid selection and failed-image states passed.`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
