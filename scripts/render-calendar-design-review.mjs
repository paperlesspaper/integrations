import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { ditherImage, replaceColors, spectra6OriginalPalette, suggestCanvasProcessingOptions } from 'epdoptimize';

const phase = process.argv[2] || 'after';
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after');
const out = 'output/calendar-design-review';
await mkdir(out, { recursive: true });
const port = 3357;
const server = spawn(process.execPath, ['node_modules/@paperlesspaper/openintegration/dist/cli.js', 'dev', 'applications/google-calendar/config.json', '--port', String(port), '--no-watch'], { stdio: 'pipe' });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const timed = (id, title, day, start, end, location, color) => ({ id, summary: title, location, color,
  start: { dateTime: `2026-07-${day}T${start}:00+02:00` }, end: { dateTime: `2026-07-${day}T${end}:00+02:00` } });
const events = [
  timed('1', 'Teamfrühstück', 22, '09:30', '10:00', 'Büro · Küche', '#0000ff'),
  timed('2', 'Entwurf besprechen', 22, '14:00', '15:30', 'Studio 2', '#0000ff'),
  timed('3', 'Abend am See', 22, '18:00', '20:00', 'Strandbad', '#00ff00'),
  { id: '4', summary: 'Mamas Geburtstag', start: { date: '2026-07-23' }, end: { date: '2026-07-24' }, color: '#ff0000' },
  timed('5', 'Zahnarzt', 23, '10:30', '11:00', 'Praxis am Markt', '#00ff00'),
  timed('6', 'Wochenplanung', 24, '11:00', '12:00', 'Zuhause', '#0000ff'),
];
const results = [];
try {
  for (let i = 0; i < 80; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/__paperless/health`)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
  for (const [width, height] of [[800,480],[480,800]]) for (const color of ['blue-light','blue-dark','dark']) {
    for (const view of phase === 'before' ? ['agenda'] : ['agenda-modern','today-next']) {
      const page = await browser.newPage();
      await page.setViewport({width,height});
      await page.emulateTimezone('Europe/Berlin');
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`http://127.0.0.1:${port}/render.html?view=${view}&color=${color}&now=2026-07-22T10:00:00Z&dayRange=3&maxEvents=12&highlightToday=true&showEventIcons=false`, {waitUntil:'networkidle0'});
      await page.waitForSelector('#website-has-loaded');
      await page.evaluate(events => {
        document.querySelector('#website-has-loaded')?.remove();
        window.postMessage({type:'INIT',data:{events,meta:{language:'de'}}},location.origin);
      }, events);
      await page.waitForSelector('#website-has-loaded');
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() => ({
        status: document.documentElement.dataset.paperlessRenderStatus,
        titles: [...document.querySelectorAll('.pp-cal-event-title')].map(e=>e.textContent),
        visible: [...document.querySelectorAll('.pp-cal-event')].filter(e=>e.getBoundingClientRect().height > 0).length,
        overflow: [...document.querySelectorAll('#app, #app *')].filter(e=>e.clientWidth>0 && (e.scrollWidth>e.clientWidth+2 || e.scrollHeight>e.clientHeight+2)).map(e=>({class:e.className,w:e.scrollWidth-e.clientWidth,h:e.scrollHeight-e.clientHeight}))
      }));
      const name = `${phase}-${view}-${color}-${width}x${height}`;
      const raw = await page.screenshot({path:`${out}/${name}-raw.png`});
      const source = createCanvas(width,height), dithered = createCanvas(width,height), device = createCanvas(width,height);
      source.getContext('2d').drawImage(await loadImage(raw),0,0);
      const suggested = suggestCanvasProcessingOptions(source,spectra6OriginalPalette,{intent:'readable'});
      await ditherImage(source,dithered,{...suggested.ditherOptions,palette:spectra6OriginalPalette,ditheringType:'errorDiffusion'});
      replaceColors(dithered,device,spectra6OriginalPalette);
      await writeFile(`${out}/${name}-epd.png`,device.toBuffer('image/png'));
      results.push({name,...metrics,errors});
      console.log(name, JSON.stringify({titles:metrics.titles.length,overflow:metrics.overflow,errors}));
      assert.equal(metrics.status, 'ready');
      assert.deepEqual(errors, []);
      if (phase === 'after') assert.deepEqual(metrics.overflow, [], name);
      await page.close();
    }
  }
  await writeFile(`${out}/${phase}-results.json`,JSON.stringify(results,null,2));
  await writeFile(`${out}/fixture.json`,JSON.stringify({now:'2026-07-22T10:00:00Z',events},null,2));
  if (phase === 'after') {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/render.html`, {waitUntil:'networkidle0'});
    await page.waitForSelector('#website-has-loaded');
    const checks = [];
    for (const [width,height] of [[800,480],[480,800],[1600,1200],[1200,1600]]) {
      await page.setViewport({width,height});
      for (const view of ['agenda-modern','today-next']) for (const kind of ['empty','dense','long']) {
        const result = await page.evaluate(({view,kind}) => {
          const pp = window.PaperlessOpenIntegration;
          const events = kind === 'empty' ? [] : Array.from({length:kind==='dense'?40:3}, (_,i)=>({
            title: kind==='long' ? 'Besprechung zur langfristigen Familienurlaubsplanung und gemeinsamen Wochenorganisation' : `Besprechung ${i+1}`,
            start:{dateTime:`2026-07-${22+Math.floor(i/15)}T${String(8+i%12).padStart(2,'0')}:00:00+02:00`},
            location:kind==='long'?'Praxisgemeinschaft am Alexanderplatz, Besprechungsraum im zweiten Obergeschoss':'Studio 2'
          }));
          pp.applyColorTheme('blue-light');
          const layout=pp.renderCalendarLayout({target:'#app',events,now:'2026-07-22T10:00:00Z',settings:{view,dayRange:7,maxEvents:40,timeZone:'Europe/Berlin',fontSize:100,locale:'de-DE'}});
          pp.fitCalendarLayout(layout);
          const shown=[...document.querySelectorAll('.pp-cal-event')].filter(e=>e.getBoundingClientRect().height>0).length;
          const hidden=[...document.querySelectorAll('.pp-cal-modern-more')].filter(e=>!e.hidden).reduce((sum,e)=>sum+Number(e.textContent.match(/\d+/)?.[0]||0),0);
          const overflow=[...document.querySelectorAll('#app, #app *')].filter(e=>e.clientWidth>0&&(e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2)).map(e=>e.className);
          return {shown,hidden,total:events.length,overflow};
        },{view,kind});
        checks.push({width,height,view,kind,...result});
        assert.deepEqual(result.overflow, [], JSON.stringify(checks.at(-1)));
        assert.equal(result.shown+result.hidden,result.total, 'Every appointment is visible or counted');
      }
    }
    await writeFile(`${out}/layout-checks.json`,JSON.stringify(checks,null,2));
    console.log(`${checks.length} empty/dense/long layout checks passed`);
    await page.close();
  }
} finally { await browser.close(); server.kill(); }
