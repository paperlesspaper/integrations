import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { ditherImage, replaceColors, spectra6OriginalPalette, suggestCanvasProcessingOptions } from 'epdoptimize';
const out='output/rolling-calendar-review';
await mkdir(out,{recursive:true});
const port=3367;
const server=spawn(process.execPath,['node_modules/@paperlesspaper/openintegration/dist/cli.js','dev','applications/google-calendar/config.json','--port',String(port),'--no-watch'],{stdio:'pipe'});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const timed=(id,summary,day,start,end,location,color='#0000ff')=>({id,summary,location,color,start:{dateTime:`2026-07-${day}T${start}:00+02:00`},end:{dateTime:`2026-07-${day}T${end}:00+02:00`}});
const events=[
  timed('1','Teamrunde',24,'09:30','10:00','Büro'),
  timed('2','Entwurf besprechen',24,'14:00','15:30','Studio 2'),
  timed('3','Abend am See',24,'18:00','20:00','Strandbad','#00ff00'),
  {id:'4',summary:'Mamas Geburtstag',start:{date:'2026-07-25'},end:{date:'2026-07-26'},color:'#ff0000'},
  timed('5','Wochenmarkt',25,'10:00','11:00','Marktplatz','#00ff00'),
  timed('6','Zahnarzt',27,'08:30','09:00','Praxis am Markt','#ff0000'),
  timed('7','Projektstart',27,'11:00','12:00','Büro'),
  {id:'8',summary:'Kurzurlaub',start:{date:'2026-07-28'},end:{date:'2026-07-30'},color:'#00ff00'},
  timed('9','Brunch',28,'11:00','12:30','Café am Park','#00ff00'),
  timed('10','Museum',29,'15:00','17:00','Innenstadt','#00ff00'),
  timed('11','Designreview',30,'09:00','10:00','Studio 2'),
  timed('12','Telefonat',30,'09:30','10:30','Online','#ff0000')
];
const sizes=[[800,480,'7,3 Zoll'],[480,800,'7,3 Zoll'],[1600,1200,'13 Zoll'],[1200,1600,'13 Zoll']];
const results=[];
try {
 for(let i=0;i<80;i++){try{if((await fetch(`http://127.0.0.1:${port}/__paperless/health`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 for(const [width,height,deviceLabel] of sizes) for(const color of ['blue-light','dark']) for(const view of ['rolling-week-list','rolling-week']) {
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width,height});await page.emulateTimezone('Europe/Berlin');
  await page.goto(`http://127.0.0.1:${port}/render.html?view=${view}&color=${color}&now=2026-07-24T10:00:00Z&maxEvents=12&highlightToday=true&showEventIcons=false`,{waitUntil:'networkidle0'});
  await page.waitForSelector('#website-has-loaded');
  await page.evaluate(events=>{document.querySelector('#website-has-loaded')?.remove();postMessage({type:'INIT',data:{events,meta:{language:'de'}}},location.origin);},events);
  await page.waitForSelector('#website-has-loaded');await page.evaluate(()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>{
   const visible=e=>e.getBoundingClientRect().height>0&&e.getBoundingClientRect().width>0;
   const withinGrid=e=>!!e.closest('.pp-cal-week-slot');
   const overflow=[...document.querySelectorAll('#app,#app *')].filter(e=>visible(e)&&!withinGrid(e)&&!e.matches('.pp-cal-week-all-day .pp-cal-event-title')&&(e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2)).map(e=>({class:e.className,w:e.scrollWidth-e.clientWidth,h:e.scrollHeight-e.clientHeight}));
   const dates=[...document.querySelectorAll('.pp-cal-rolling-day,.pp-cal-week-cell')].filter(visible).map(e=>e.dataset.date);
   const collisions=[];
   for(const column of document.querySelectorAll('.pp-cal-week-cell')) {
    const slots=[...column.querySelectorAll('.pp-cal-week-slot')].filter(visible).map(e=>e.getBoundingClientRect());
    for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){const a=slots[i],b=slots[j];if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)collisions.push(column.dataset.date);}
   }
   return {status:document.documentElement.dataset.paperlessRenderStatus,overflow,dates,collisions,visibleEvents:[...document.querySelectorAll('.pp-cal-event')].filter(visible).length,hiddenEvents:[...document.querySelectorAll('.pp-cal-modern-more')].filter(visible).reduce((sum,e)=>sum+Number(e.textContent.match(/\d+/)?.[0]||0),0)};
  });
  const name=`${view}-${color}-${width}x${height}`;
  const raw=await page.screenshot({path:`${out}/${name}-raw.png`});
  const input=createCanvas(width,height),dithered=createCanvas(width,height),device=createCanvas(width,height);
  input.getContext('2d').drawImage(await loadImage(raw),0,0);
  const options=suggestCanvasProcessingOptions(input,spectra6OriginalPalette,{intent:'readable'});
  await ditherImage(input,dithered,{...options.ditherOptions,palette:spectra6OriginalPalette,ditheringType:'errorDiffusion'});replaceColors(dithered,device,spectra6OriginalPalette);
  await writeFile(`${out}/${name}-epd.png`,device.toBuffer('image/png'));
  results.push({name,width,height,deviceLabel,view,color,...metrics,errors});
  console.log(name,JSON.stringify(metrics));
  await page.close();
 }
 await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));
 await writeFile(`${out}/fixture.json`,JSON.stringify({now:'2026-07-24T10:00:00Z',events},null,2));
 for(const result of results){assert.equal(result.status,'ready');assert.equal(result.dates.length,7,result.name);assert.equal(result.dates[0],'2026-07-24');assert.equal(result.dates[6],'2026-07-30');assert.deepEqual(result.errors,[]);assert.deepEqual(result.collisions,[]);assert.deepEqual(result.overflow,[],result.name);assert.equal(result.visibleEvents+result.hiddenEvents,13,result.name+' accounts for every visible-day occurrence');}
 console.log(`${results.length} device/orientation/theme renders passed`);
}finally{await browser.close();server.kill();}
