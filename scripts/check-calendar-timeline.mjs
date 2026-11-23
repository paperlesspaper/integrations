import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import puppeteer from 'puppeteer-core';
const origin='http://127.0.0.1:3393', output='output/playwright/calendar-timeline';
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'3393'},stdio:'pipe'});
let browser;
try {
  let ready=false;for(let i=0;i<60;i++){try{if((await fetch(origin+'/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready);
  browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const fixture=JSON.parse(await readFile('docs/screenshots/calendars/fixtures.json')).timeline;
  const events=fixture.map(e=>({...e,title:e.summary}));
  await page.setRequestInterception(true);page.on('request',async request=>{
    if(new URL(request.url()).pathname.endsWith('/api/data'))await request.respond({status:200,contentType:'application/json',body:JSON.stringify({events,calendarName:'Beispielkalender'})});else await request.continue();
  });
  const settings={view:'day-timeline',now:'2026-07-24T12:45:00Z',locale:'de-DE',timeZone:'Europe/Berlin',showEventIcons:true,showHeader:false,color:'blue-light'};
  for(const slug of ['google-calendar','apple-calendar','outlook-calendar','nextcloud-calendar','proton-calendar','caldav','webcal']){
    const config=JSON.parse(await readFile(`applications/${slug}/config.json`));assert.ok(config.formSchema.properties.view.enum.includes('day-timeline'));
    await page.goto(`${origin}/${slug}/render.html?${new URLSearchParams(settings)}`,{waitUntil:'load'});await page.waitForSelector('#website-has-loaded');
    if(slug==='google-calendar'){await page.evaluate(events=>{document.querySelector('#website-has-loaded')?.remove();postMessage({type:'INIT',data:{events,meta:{language:'de'}}},location.origin);},fixture);await page.waitForSelector('#website-has-loaded');}
    assert.equal(await page.$$eval('.pp-cal-timeline-slot',n=>n.length),6,slug+' timed events');
    assert.equal(await page.$$eval('.pp-cal-task-box',n=>n.length),0,slug+' no inactive checkboxes');
    assert.equal(await page.$$eval('[data-timeline-row]',n=>n.length),3,slug+' due entries');
    assert.doesNotMatch(await page.$eval('.pp-cal-timeline-now',n=>n.textContent),/\d/,slug+' no stale clock label');
    assert.equal(await page.$eval('.pp-cal-timeline-clock',n=>n.textContent),'19:00',slug+' next event');
  }
  const scenarios=[
    ['empty',[],{}],['normal',events,{}],
    ['descenders',events.map(e=>({...e,title:(e.title.includes('[todo]')?'[todo] ':'')+'Gepäck prüfen · Planung gypqj',location:'Bergweg · Yogagruppe'})),{}],
    ['all-day',[{title:'Ferien',start:{date:'2026-07-24'}}],{}],
    ['sidebar-off',events,{timelineShowSidebar:false,timelineShowNow:false,timelineShowGaps:false}],
    ['dense',Array.from({length:30},(_,i)=>({...events[0],title:'Termin '+i})),{}],
    ['long',events.map(e=>({...e,title:e.title+' '+('Sehr langer Titel ').repeat(8),location:'Langer Ort '.repeat(12)})),{fontSize:150,showHeader:true,personalTitle:'Unsere Termine',showDaySummary:true,informationDensity:'spacious'}]
  ];
  const results=[];
  for(const [width,height] of [[800,480],[480,800],[1600,1200],[1200,1600]])for(const color of ['blue-light','dark'])for(const [name,items,extra] of scenarios){
    await page.setViewport({width,height});
    const result=await page.evaluate(async({events,settings,color,extra})=>{
      const lib=window.PaperlessOpenIntegration;lib.applyColorTheme(color);
      const layout=lib.renderCalendarLayout({target:'#app',events,settings:{...settings,...extra},now:settings.now});await document.fonts.ready;lib.fitCalendarLayout(layout);
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const target=document.querySelector('#app'),visible=e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
      const slots=[...target.querySelectorAll('.pp-cal-timeline-slot')].filter(visible),collisions=[];
      for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){const a=slots[i].getBoundingClientRect(),b=slots[j].getBoundingClientRect();if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)collisions.push([i,j]);}
      const overlaps=[],clipped=[];
      for (const title of target.querySelectorAll('.pp-cal-event-title,.pp-cal-timeline-side-title')) {
        if (!visible(title)) continue;
        const style=getComputedStyle(title);
        const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=style.font;
        const ink=ctx.measureText('Gepäck gypqj');
        if (parseFloat(style.lineHeight)<ink.actualBoundingBoxAscent+ink.actualBoundingBoxDescent) clipped.push('glyph ink exceeds line box');
      }
      for (const card of target.querySelectorAll('.pp-cal-timeline-slot.is-current .pp-cal-event')) {
        if (getComputedStyle(card).outlineStyle!=='none') clipped.push('unwanted current-event outline');
      }
      for(const slot of slots){const pieces=[...slot.querySelectorAll('.pp-cal-event-heading,.pp-cal-event-time,.pp-cal-event-location')].filter(visible);for(const piece of pieces){const p=piece.getBoundingClientRect(),c=slot.getBoundingClientRect();if(p.top<c.top-1||p.bottom>c.bottom+1)clipped.push(piece.className);}
      for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++){const a=pieces[i].getBoundingClientRect(),b=pieces[j].getBoundingClientRect();if(Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>1)overlaps.push(slot.textContent);}}
      const outside=[...target.querySelectorAll('.pp-cal-timeline-heading,.pp-cal-timeline-grid,.pp-cal-timeline-sidebar,.pp-cal-timeline-slot,.pp-cal-timeline-side-row')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.top< -1||r.left< -1||r.bottom>innerHeight+1||r.right>innerWidth+1;}).map(e=>e.className);
      const counter=target.querySelector('.pp-cal-timeline-overflow');
      const geometry=()=>slots.map(e=>e.getAttribute('style')+' '+e.hidden).join('|');const before=geometry();lib.fitCalendarLayout(layout);
      return {outside,collisions,overlaps,clipped,slots:slots.length,hidden:Number(counter.textContent.match(/\d+/)?.[0]||0),idempotent:before===geometry(),sidebar:!!target.querySelector('.pp-cal-timeline-sidebar'),now:!!target.querySelector('.pp-cal-timeline-now'),gaps:target.querySelectorAll('.pp-cal-timeline-gap').length};
    },{events:items,settings,color,extra});
    const id=`${name}-${color}-${width}x${height}`;
    assert.deepEqual(result.outside,[],id+' screen bounds');assert.deepEqual(result.collisions,[],id+' slot collisions');assert.deepEqual(result.overlaps,[],id+' text overlap');assert.deepEqual(result.clipped,[],id+' clipped card details');assert.ok(result.idempotent,id+' repeat fit');
    if(name==='dense')assert.equal(result.slots+result.hidden,30,id+' overflow accounting');
    if(name==='sidebar-off'){assert.equal(result.sidebar,false);assert.equal(result.now,false);assert.equal(result.gaps,0);}
    if(name==='normal'||name==='descenders')await page.screenshot({path:`${output}/${id}.png`});
    results.push({name,width,height,color,...result});
  }
  assert.deepEqual(errors,[]);await writeFile(`${output}/results.json`,JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({providers:7,scenarios:results.length,checks:'bounds, collision placement, text overlap, overflow accounting, switches, idempotent fitting'}));
}finally{await browser?.close();server.kill();}
