import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { loadBambu } from '../applications/bambu-lab/api/data.js';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const port = Number(process.env.BAMBU_TEST_PORT || 4359);
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server/index.js'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  env: { ...process.env, PORT: String(port) }, stdio: 'ignore',
});
const cleanup = () => server.kill();
process.on('exit', cleanup);
for (let attempt = 0; ; attempt++) {
  try { const response = await fetch(`${base}/health`); if (response.ok) break; } catch {}
  if (attempt >= 60) { cleanup(); throw Error('Local integration server failed to start'); }
  await new Promise(resolve => setTimeout(resolve, 100));
}
const browser = await puppeteer.launch({executablePath: process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true});
const page = await browser.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
try {
for (const [width,height] of [[800,480],[480,800],[1600,1200],[1200,1600]]) {
  await page.setViewport({width,height});
  await page.goto(`${base}/bambu-lab/render.html`);
  await page.waitForSelector('#website-has-loaded');
  for (const language of ['de', 'en']) {
  for (const color of ['blue-light','blue-dark','dark']) {
    for (const demoState of ['printing','finished','failed','empty']) {
      await page.evaluate(({settings,language})=>{document.querySelector('#website-has-loaded')?.remove();window.postMessage({type:'INIT',data:{meta:{language,pluginSettings:settings}}},'*');},{language,settings:{color,demoState,sampleData:true,historyLimit:4,title:'A long printer title with enough words to exceed the available header width'}});
      await page.waitForSelector('#website-has-loaded');
      const report=await page.evaluate(()=>{
        const sel=['#app','header','.hero','.model','.details','.metrics','.history','footer'];
        const problems=[];
        for(const s of sel) {
          const el=document.querySelector(s);if(!el)continue;
          const b=el.getBoundingClientRect();
          if(el.scrollHeight>el.clientHeight+2 || el.scrollWidth>el.clientWidth+2) problems.push({s,scroll:[el.scrollWidth,el.scrollHeight],client:[el.clientWidth,el.clientHeight]});
          if(b.bottom>innerHeight+1||b.right>innerWidth+1) problems.push({s,outside:true});
        }
        return problems;
      });
      assert.deepEqual(report,[],JSON.stringify({width,height,color,demoState,report}));
    }
  }
}
}
let fixture = await loadBambu({ sampleData: true, historyLimit: 4 });
fixture.current.title = '<img src=x onerror=alert(1)> ' + 'A very long model name with several separate words '.repeat(4);
fixture.current.image = `${base}/bambu-lab/assets/missing-image.png`;
fixture.current.materials = ['PLA', 'PETG', 'ABS', 'TPU'];
await page.setRequestInterception(true);
page.on('request', request => {
  if (request.url().endsWith('/bambu-lab/api/data')) {
    request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) });
  } else request.continue();
});
for (const [width, height] of [[800,480], [480,800]]) {
  await page.setViewport({ width, height });
  await page.goto(`${base}/bambu-lab/render.html?showHeader=false`);
  await page.waitForSelector('#website-has-loaded');
  assert.equal(await page.$('.model img'), null, 'broken image must become a placeholder');
  assert.equal(await page.$('h2 img'), null, 'model titles must be escaped');
  assert.ok(await page.$('.placeholder'));
  const overflow = await page.evaluate(() => ['#app', '.hero', '.details'].some(selector => {
    const element = document.querySelector(selector);
    return element.scrollHeight > element.clientHeight + 2;
  }));
  assert.equal(overflow, false, 'long model names must fit without a header');
}
for (const error of ['setup', 'auth', 'upstream']) {
  fixture = { error };
  await page.goto(`${base}/bambu-lab/render.html`);
  await page.waitForSelector('#website-has-loaded');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.paperlessRenderStatus), 'error');
  assert.equal(await page.$('.hero'), null, 'errors must never retain a demo print');
}
assert.deepEqual(errors,[]);
console.log('96 render/update combinations, long model names, broken images and three error states passed.');
} finally {await browser.close(); cleanup();}
