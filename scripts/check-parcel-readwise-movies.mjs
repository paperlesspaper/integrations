import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const root = resolve(import.meta.dirname, '..');
const slugs = ['parcel','readwise','upcoming-movies'];
const sizes = [[800,480],[480,800],[1600,1200],[1200,1600]];
const cli = join(root,'node_modules/@paperlesspaper/openintegration/dist/cli.js');
const run = args => new Promise((res,rej)=>{
  const child=spawn(process.execPath,args,{cwd:root,stdio:['ignore','pipe','pipe']});let out='';
  child.stdout.on('data',s=>out+=s);child.stderr.on('data',s=>out+=s);
  child.on('error',rej);child.on('close',code=>code?rej(Error(out)):res(out));
});
for(const slug of slugs) await run([cli,'check',`applications/${slug}/config.json`]);
console.log((await run(['--test','tests/parcel-readwise-movies.test.mjs'])).trim());
const port=Number(process.env.PAPERLESSPAPER_TEST_PORT||3327);
const server=spawn(process.execPath,['server/index.js'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:'ignore'});
let browser;
const results=[];
await mkdir(join(root,'output/parcel-readwise-movies'),{recursive:true});
try {
  for(let i=0;i<60;i++){try{if((await fetch(`http://127.0.0.1:${port}/health`)).ok)break;}catch{} await new Promise(r=>setTimeout(r,100));}
  browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  for(const slug of slugs){
    const config=JSON.parse(await readFile(join(root,`applications/${slug}/config.json`),'utf8'));
    for(const [variantIndex,variant] of config.configVariants.entries()) for(const [width,height] of sizes){
      const page=await browser.newPage();await page.setViewport({width,height});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.evaluateOnNewDocument(({variant,config})=>{
        addEventListener('DOMContentLoaded',()=>setTimeout(()=>postMessage({type:'INIT',data:{meta:{language:'de',pluginManifest:config,pluginSettings:variant}}},location.origin),50));
      },{variant,config});
      await page.goto(`http://127.0.0.1:${port}/${slug}/`);
      await page.waitForFunction(()=>document.documentElement.dataset.paperlessRenderStatus==='ready');
      const metrics=await page.evaluate(color=>{
        const selectors='#app,#content,header,footer,.delivery,.quotation,.credit,.movie,.movie-caption';
        const overflow=[...document.querySelectorAll(selectors)].filter(e=>e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2).map(e=>({name:e.id||e.className||e.tagName,h:e.scrollHeight-e.clientHeight,w:e.scrollWidth-e.clientWidth}));
        return {overflow,theme:document.body.classList.contains(color),sample:document.body.innerText.includes('DEMODATEN'),images:[...document.images].every(i=>i.complete&&i.naturalWidth>0)};
      },variant.color);
      const label=`${slug}-${variantIndex?'dark':'default'}-${width}x${height}`;
      await page.screenshot({path:join(root,`output/parcel-readwise-movies/${label}-raw.png`)});
      results.push({label,...metrics,errors});
      console.log(`${label}: ${JSON.stringify(metrics)}`);
      assert.deepEqual(errors,[]);assert.deepEqual(metrics.overflow,[]);assert.ok(metrics.theme&&metrics.sample&&metrics.images);
      if(width===800&&variantIndex===0){
        // Exercise later host INIT, including language + settings updates without a reload.
        await page.evaluate(({config,variant})=>postMessage({type:'INIT',data:{meta:{language:'en',pluginManifest:config,pluginSettings:{...variant,title:'Updated display',color:'red-dark'}}}},location.origin),{config,variant});
        await page.waitForFunction(()=>document.documentElement.lang==='en'&&document.querySelector('h1')?.textContent==='Updated display'&&document.documentElement.dataset.paperlessRenderStatus==='ready');
        assert.ok(await page.evaluate(()=>document.body.classList.contains('red-dark')&&document.body.innerText.includes('DEMO DATA')));
      }
      await page.close();
    }
    // Mock API responses for deterministic stress and error/empty-state checks.
    const page=await browser.newPage();await page.setViewport({width:480,height:800});
    await page.setRequestInterception(true);
    let fixture;
    page.on('request',req=>{
      if(req.url().includes('/api/data'))req.respond({status:fixture.status||200,contentType:'application/json',body:JSON.stringify(fixture.body)});
      else req.continue();
    });
    const stress='A very long text <script>window.injected=true</script> & '.repeat(50);
    fixture={body:{sample:false,source:slug,updatedAt:new Date().toISOString(),total:1,index:0,highlight:{text:stress,title:stress,author:stress,note:stress},deliveries:[{description:stress,status:7,carrier:stress,event:stress}],movies:[{title:stress,releaseDate:'2026-10-01',overview:stress,poster:''}],region:'DE'}};
    await page.goto(`http://127.0.0.1:${port}/${slug}/`);
    await page.waitForFunction(()=>document.documentElement.dataset.paperlessRenderStatus==='ready');
    assert.equal(await page.evaluate(()=>window.injected),undefined);
    assert.ok(await page.evaluate(()=>document.querySelector('#app').scrollHeight<=innerHeight+2));
    if(slug==='readwise')assert.ok(await page.evaluate(()=>document.querySelector('#count').textContent.includes('Auszug')));
    await page.screenshot({path:join(root,`output/parcel-readwise-movies/${slug}-stress.png`)});
    fixture={body:{sample:false,source:slug,updatedAt:new Date().toISOString(),total:0,highlight:null,deliveries:[],movies:[],region:'DE'}};
    await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.paperlessRenderStatus==='ready');
    assert.ok(await page.$('.empty'));
    fixture={status:502,body:{error:'provider failed'}};
    await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.paperlessRenderStatus==='error');
    assert.ok(await page.$('.error'));
    await page.close();
  }
} finally {await browser?.close();server.kill();await writeFile(join(root,'output/parcel-readwise-movies/layout-report.json'),JSON.stringify(results,null,2)+'\n');}
if(process.argv.includes('--render')){
  for(const slug of slugs){
    const config=JSON.parse(await readFile(join(root,`applications/${slug}/config.json`),'utf8'));
    await mkdir(join(root,`applications/${slug}/screenshots`),{recursive:true});
    for(const variant of config.configVariants)for(const [width,height] of sizes){
      const {screenshots,...settings}=variant;
      const output=join(root,`applications/${slug}`,screenshots[`${width}x${height}`]);
      await run([cli,'render',`applications/${slug}/config.json`,'--viewport',`${width}x${height}`,'--settings',JSON.stringify(settings),'--output',output]);
      console.log(`EPD ${slug} ${settings.color} ${width}x${height}: OK`);
    }
  }
}
