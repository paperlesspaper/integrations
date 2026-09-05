#!/usr/bin/env node
// Real-browser regressions for the shared illustrated daily-card layout.
// Run after npm install; --source-runtime is for developing the sibling package.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'output/of-the-day-layouts');
const source=process.argv.includes('--source-runtime');
const full=process.argv.includes('--full');
const variantsOnly=process.argv.includes('--variants-only');
const sourceAssets=path.resolve(root,'../paperlesspaper-openintegration/dist');
const sizes=[[800,480],[480,800],[1600,1200],[1200,1600]];
const apps=[
 ['tree','trees','coast-redwood'],['train','trains','frecciarossa-1000'],
 ['bird','birds','andean-condor'],['spacecraft','spacecraft','apollo-command-module'],
 ['fish','fish','mawsonia'],['dinosaur','dinosaurs','gallimimus']
];
await fs.mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 const base=url.pathname.startsWith('/assets/')?(source?sourceAssets:path.join(root,'public')):path.join(root,'applications');
 const file=path.resolve(base,'.'+(url.pathname.startsWith('/assets/')?url.pathname.slice(7):url.pathname));
 if(!file.startsWith(base+path.sep))throw Error('Invalid path');
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox','--disable-font-subpixel-positioning','--disable-lcd-text','--font-render-hinting=none']});
const results=[];
const failures=[];
try{
 for(const [kind,dataName,pinned] of apps){
  const slug=`${kind}-of-the-day`,folder=path.join(root,'applications',slug);
  const config=JSON.parse(await fs.readFile(path.join(folder,'config.json'),'utf8'));
  const context={window:{}};vm.runInNewContext(await fs.readFile(path.join(folder,'data',`${dataName}.js`),'utf8'),context);
  const catalog=Object.values(context.window)[0];
  const factKeys=Object.keys(config.nativeSettings).filter(key=>key.startsWith('show')&&!['showHeader','showFactCount','showRotationCount'].includes(key));
  const allFacts=Object.fromEntries(factKeys.map(key=>[key,true]));
  const noFacts=Object.fromEntries(factKeys.map(key=>[key,false]));
  const cases=variantsOnly?[]:[{name:'default',id:pinned,language:'de',settings:{}}];
  if(full||variantsOnly){
   cases.push(...(config.configVariants||[]).map((variant,index)=>{const {screenshots,...settings}=variant;return {name:`variant-${index+1}`,id:pinned,language:config.language[0],settings};}));
  }
  if(full){
   cases.push(...[
    {name:'small',settings:{textSize:'small'}},
    {name:'big',settings:{textSize:'big'}},
    {name:'all-big',settings:{...allFacts,textSize:'big'}},
    {name:'fact-count',settings:{...allFacts,textSize:'big',showFactCount:true}},
    {name:'rotation-count',settings:{showRotationCount:true}},
    {name:'both-counts',settings:{...allFacts,textSize:'big',showFactCount:true,showRotationCount:true}},
    {name:'counts-no-header',settings:{...allFacts,textSize:'big',showFactCount:true,showRotationCount:true,showHeader:false}},
    {name:'no-header',settings:{showHeader:false}},
    {name:'no-facts',settings:noFacts},
    {name:'image-only',settings:{...noFacts,showHeader:false}},
    {name:'dark',settings:{color:'dark'}},
    {name:'accent',settings:{color:'red-light'}},
    ...config.language.filter(language=>language!=='de').map(language=>({name:language,language,settings:{}}))
   ].map(c=>({id:pinned,language:'de',...c})));
   const longest=[...catalog].sort((a,b)=>b.name.length-a.name.length)[0];
   const wordiest=[...catalog].sort((a,b)=>JSON.stringify(b).length-JSON.stringify(a).length)[0];
   const dimensions=await Promise.all(catalog.map(async item=>{const png=await fs.readFile(path.resolve(folder,item.image));return {item,ratio:png.readUInt32BE(16)/png.readUInt32BE(20)};}));
   dimensions.sort((a,b)=>a.ratio-b.ratio);
   for(const item of new Map([longest,wordiest,dimensions[0].item,dimensions.at(-1).item].map(item=>[item.id,item])).values()){
    cases.push({name:`catalog-${item.id}`,id:item.id,language:'de',settings:{}});
   }
  }
  for(const c of cases)for(const [width,height] of sizes){
   const key=`${slug}-${c.name}-${width}x${height}`;
   const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.setViewport({width,height,deviceScaleFactor:1});
    await page.evaluateOnNewDocument(()=>{const NativeDate=Date;window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:['2026-09-05T12:00:00Z']));}static now(){return new NativeDate('2026-09-05T12:00:00Z').getTime();}};});
    await page.goto(`http://127.0.0.1:${server.address().port}/${slug}/render.html`,{waitUntil:'domcontentloaded'});
    const settings={...config.nativeSettings,[`${kind}Id`]:c.id,...c.settings};
    await page.evaluate(data=>window.postMessage({type:'INIT',cmd:'message',data},'*'),{meta:{language:c.language,pluginSettings:settings}});
    await page.waitForFunction(()=>document.documentElement.dataset.paperlessRenderStatus==='ready'||document.documentElement.dataset.paperlessRenderStatus==='error',{timeout:10000});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const report=await page.evaluate(settings=>{
     const root=document.querySelector('.pp-otd-screen');
     if(!root)return {issues:['Missing shared layout'],status:document.documentElement.dataset.paperlessRenderStatus};
     const bounds=root.getBoundingClientRect(),issues=[];
     const visible=e=>e.getClientRects().length>0;
     const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
     for(const e of root.querySelectorAll('*')){
      if(!visible(e))continue;const r=e.getBoundingClientRect();
      if(e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)issues.push(`Overflow: ${e.className}`);
      if(r.x<bounds.x-1||r.y<bounds.y-1||r.right>bounds.right+1||r.bottom>bounds.bottom+1)issues.push(`Outside screen: ${e.className}`);
     }
     const stage=root.querySelector('.pp-otd-image-stage'),image=stage.querySelector('img');
     const sr=stage.getBoundingClientRect(),ir=image.getBoundingClientRect();
     if(!image.complete||!image.naturalWidth)issues.push('Image missing');
     if(ir.x<sr.x-1||ir.y<sr.y-1||ir.right>sr.right+1||ir.bottom>sr.bottom+1)issues.push('Image outside stage');
     const regions=[...root.querySelectorAll('.pp-otd-header,.pp-otd-image-stage,.pp-otd-fact-grid,.pp-otd-footer')].filter(visible);
     for(let i=0;i<regions.length;i++)for(let j=i+1;j<regions.length;j++){
      const a=regions[i].getBoundingClientRect(),b=regions[j].getBoundingClientRect();
      if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2)issues.push(`Overlap: ${regions[i].className}/${regions[j].className}`);
     }
     const facts=[...root.querySelectorAll('.pp-otd-fact')],shown=facts.filter(visible);
     const summary=root.querySelector('.pp-otd-facts-shown');
     const expectSummary=settings.showFactCount===true&&shown.length<facts.length;
     if(visible(summary)!==expectSummary)issues.push('Incorrect fact-count visibility');
     if(expectSummary&&(!summary.textContent.includes(String(shown.length))||!summary.textContent.includes(String(facts.length))))issues.push('Incorrect fact count');
     const rotation=root.querySelector('[data-key=rotation]');
     if(Boolean(rotation&&visible(rotation))!==(settings.showRotationCount===true&&settings.showHeader!==false))issues.push('Incorrect rotation-count visibility');
     if(root.dataset.layoutOverflow==='true')issues.push('Fitter reports overflow');
     const font=selector=>{const e=root.querySelector(selector);return e?parseFloat(getComputedStyle(e).fontSize):null;};
     return {factCountVisible:visible(summary),rotationCountVisible:Boolean(rotation&&visible(rotation)),issues,status:document.documentElement.dataset.paperlessRenderStatus,selected:facts.length,shown:shown.length,header:visible(root.querySelector('.pp-otd-header')),title:root.querySelector('h1').textContent,titlePx:font('h1'),descriptionPx:font('.pp-otd-signature'),valuePx:font('.pp-otd-value'),image:rect(image),stage:rect(stage),mode:root.classList.contains('pp-otd--side')?'side':'stack'};
    },settings);
    if(full && c.name==='default'){
     // Reuse the same page: resizing must restore omitted facts and recompute type,
     // and successive INIT messages must not leave stale state or duplicate listeners.
     const nextWidth=width>height?1600:1200,nextHeight=width>height?1200:1600;
     await page.setViewport({width:nextWidth,height:nextHeight,deviceScaleFactor:1});
     await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     const resized=await page.evaluate(()=>({shown:Number(document.querySelector('.pp-otd-screen').dataset.visibleFacts),overflow:document.querySelector('.pp-otd-screen').dataset.layoutOverflow}));
     if(resized.shown<report.shown||resized.overflow==='true')report.issues.push('Resize lost facts or overflowed');
     await page.setViewport({width,height,deviceScaleFactor:1});
     await page.evaluate(data=>window.postMessage({type:'INIT',cmd:'message',data},'*'),{meta:{language:c.language,pluginSettings:{...settings,...noFacts,showHeader:false}}});
     await page.waitForFunction(()=>document.documentElement.dataset.paperlessRenderStatus==='ready'&&document.querySelector('.pp-otd-screen')?.dataset.selectedFacts==='0',{timeout:10000});
     const empty=await page.evaluate(()=>({header:getComputedStyle(document.querySelector('.pp-otd-header')).display,overflow:document.querySelector('.pp-otd-screen').dataset.layoutOverflow}));
     if(empty.header!=='none'||empty.overflow==='true')report.issues.push('INIT image-only transition failed');
     await page.evaluate(data=>window.postMessage({type:'INIT',cmd:'message',data},'*'),{meta:{language:c.language,pluginSettings:settings}});
     await page.waitForFunction(()=>document.documentElement.dataset.paperlessRenderStatus==='ready'&&Number(document.querySelector('.pp-otd-screen')?.dataset.selectedFacts)>0,{timeout:10000});
     const restored=await page.evaluate(()=>({shown:Number(document.querySelector('.pp-otd-screen').dataset.visibleFacts),overflow:document.querySelector('.pp-otd-screen').dataset.layoutOverflow}));
     if(restored.shown!==report.shown||restored.overflow==='true')report.issues.push('INIT did not restore original layout');
    }
    if(c.name==='image-only'||c.name==='no-facts')if(report.selected!==0)report.issues.push('Deselected facts restored');
    if(settings.showHeader===false&&report.header)report.issues.push('Header unexpectedly visible');
    if(report.status!=='ready')report.issues.push('Render failed');
    report.issues.push(...errors);
    if(c.name==='default'||report.issues.length)await page.screenshot({path:path.join(out,`${key}.png`)});
    results.push({key,slug,width,height,...report});
    if(report.issues.length){failures.push({key,issues:report.issues});console.log('FAIL',key,JSON.stringify(report.issues));}
   }catch(error){failures.push({key,issues:[error.message]});console.log('FAIL',key,error.message);}
   finally{await page.close();}
  }
  console.log(`${slug}: checked ${cases.length*4} renders`);
 }
}finally{await browser.close();server.close();}
await fs.writeFile(path.join(out,variantsOnly?'variants-results.json':'results.json'),JSON.stringify({runtime:source?'sibling source build':'installed vendor',renders:results.length,failures,results},null,2));
console.log(`${results.length} renders, ${failures.length} failed`);
if(failures.length)process.exitCode=1;
