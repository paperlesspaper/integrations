import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { ditherImage, replaceColors, spectra6OriginalPalette, suggestCanvasProcessingOptions } from 'epdoptimize';
import { loadDepartures } from '../applications/sbb-abfahrten/api/data.js';

// Explicit, labelled fixtures for comparing the two consumers of the shared UI.
const output = 'docs/screenshots/departures';
await mkdir(output, { recursive: true });
const port = Number(process.env.DEPARTURE_SCREENSHOT_PORT || 4368);
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
let browser;
try {
  for (let i = 0; ; i++) {
    try { if ((await fetch(`${base}/health`)).ok) break; } catch {}
    if (i >= 60) throw Error('Server failed to start');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage();
  let fixture;
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (/\/(sbb-abfahrten|deutsche-bahn-abfahrten)\/api\/data$/.test(request.url())) request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) });
    else request.continue();
  });
  for (const slug of ['sbb-abfahrten', 'deutsche-bahn-abfahrten']) {
    const config = JSON.parse(await readFile(`applications/${slug}/config.json`, 'utf8'));
    fixture = await loadDepartures({ sampleData: true, limit: 7 });
    fixture.departures[1].direction = 'Niederweningen';
    if (slug === 'deutsche-bahn-abfahrten') {
      fixture.station.name = 'Berlin Hbf'; fixture.source = 'DB · Beispieldaten';
      fixture.departures.forEach((row, i) => { row.operator = 'DB'; row.line = ['ICE 100', 'RE 1', 'IC 2048', 'ICE 507', 'RE 5', 'ICE 1604', 'RE 8'][i]; row.direction = ['Leipzig Hbf', 'Magdeburg Hbf', 'Hamburg-Altona', 'München Hbf', 'Stralsund Hbf', 'Erfurt Hbf', 'Wittenberge'][i]; });
      fixture.departures[2].cancelled = true;
    }
    for (const [width, height] of [[800,480], [480,800], [1600,1200], [1200,1600]]) {
      for (const color of ['red-light', 'blue-dark', 'dark']) {
        await page.setViewport({ width, height });
        await page.goto(`${base}/${slug}/render.html?color=${color}`);
        await page.waitForSelector('#website-has-loaded');
        const stem = `${slug}-${color}-${width}x${height}`;
        const raw = await page.screenshot({ path: `${output}/${stem}-raw.png` });
        const source = createCanvas(width,height), dithered = createCanvas(width,height), device = createCanvas(width,height);
        source.getContext('2d').drawImage(await loadImage(raw),0,0);
        const options = suggestCanvasProcessingOptions(source, spectra6OriginalPalette, { intent: 'readable' });
        await ditherImage(source,dithered,{ ...options.ditherOptions, palette: spectra6OriginalPalette });
        replaceColors(dithered,device,spectra6OriginalPalette);
        const png = device.toBuffer('image/png');
        await writeFile(`${output}/${stem}-epd.png`,png);
        if (slug === 'sbb-abfahrten' && color !== 'dark') {
          const variant = config.configVariants.find(v => v.color === color);
          await writeFile(`applications/${slug}/${variant.screenshots[`${width}x${height}`]}`, png);
        }
        console.log(stem);
      }
    }
  }
} finally { await browser?.close(); server.kill(); }
