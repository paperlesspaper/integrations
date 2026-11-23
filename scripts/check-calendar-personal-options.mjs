import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import puppeteer from 'puppeteer-core';

const providers=['google-calendar','apple-calendar','outlook-calendar','nextcloud-calendar','proton-calendar','caldav','webcal'];
const views=['agenda','agenda-modern','today-next','day','three-days','week','rolling-week-list','rolling-week','year','day-timeline'];
const output='output/playwright/calendar-personal-check';
await mkdir(output,{recursive:true});
const origin='http://127.0.0.1:3392';
const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'3392'},stdio:'pipe'});
let browser;
try {
  let ready=false;
  for(let i=0;i<60;i++){try{if((await fetch(origin+'/health')).ok){ready=true;break;}}catch{} await new Promise(r=>setTimeout(r,100));}
  assert.ok(ready,'Server ready');
  browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const events=Array.from({length:18},(_,i)=>({id:String(i),title:['Zahnarzt','Meeting','[icon:shopping] Birthday','Telefonat','Kino','Teamfrühstück'][i%6],start:{dateTime:`2026-07-${String(24+Math.floor(i/3)).padStart(2,'0')}T${12+i%3*2}:00:00+02:00`},end:{dateTime:`2026-07-${String(24+Math.floor(i/3)).padStart(2,'0')}T${13+i%3*2}:00:00+02:00`},location:'Beispielort'}));
  await page.setRequestInterception(true);
  page.on('request',async request=>{
    if(new URL(request.url()).pathname.endsWith('/api/data'))await request.respond({status:200,contentType:'application/json',body:JSON.stringify({events,calendarName:'Testkalender',sample:true})});
    else await request.continue();
  });
  const settings={view:'agenda-modern',now:'2026-07-24T10:30:00Z',locale:'de-DE',timeZone:'Europe/Berlin',dayRange:7,maxEvents:100,showDaySummary:true,showEventIcons:true,automaticEventIcons:true,showHeader:true,personalTitle:'Unsere Woche',personalSubtitle:'Familie Müller',informationDensity:'automatic'};
  const results=[];
  for(const slug of providers){
    const manifest=JSON.parse(await readFile(`applications/${slug}/config.json`,'utf8'));
    for(const key of ['showDaySummary','automaticEventIcons','showEventIcons','showHeader','personalTitle','personalSubtitle','informationDensity'])assert.ok(key in manifest.formSchema.properties,slug+' '+key+' exposed');
    await page.setViewport({width:800,height:480});
    await page.goto(`${origin}/${slug}/render.html?${new URLSearchParams(settings)}`,{waitUntil:'load'});
    await page.waitForSelector('#website-has-loaded');
    if(slug==='google-calendar'){
      await page.evaluate(events=>{document.querySelector('#website-has-loaded')?.remove();postMessage({type:'INIT',data:{events:events.map(e=>({...e,summary:e.title})),meta:{language:'de'}}},location.origin);},events);
      await page.waitForSelector('#website-has-loaded');
    }
    const result=await page.evaluate(()=>({title:document.querySelector('.pp-cal-title')?.textContent,summary:document.querySelector('.pp-cal-day-summary')?.textContent,icons:document.querySelectorAll('.pp-cal-event-icon').length,density:document.querySelector('#app').dataset.informationDensity}));
    assert.equal(result.title,'Unsere Woche',slug);
    assert.match(result.summary,/3 (?:timed events remaining|Termine)/,slug);
    assert.ok(result.icons>0,slug);
    assert.equal(result.density,'automatic',slug);
    results.push({provider:slug,...result});
  }
  // Exercise the canonical renderer with all views, themes and target geometries.
  for(const view of views)for(const [width,height] of [[800,480],[480,800],[1600,1200],[1200,1600]])for(const color of ['blue-light','dark']){
    await page.setViewport({width,height});
    const metrics=await page.evaluate(async({events,settings,view,color})=>{
      const lib=window.PaperlessOpenIntegration;lib.applyColorTheme(color);
      const layout=lib.renderCalendarLayout({target:'#app',events,now:settings.now,settings:{...settings,view}});
      await document.fonts.ready;lib.fitCalendarLayout(layout);
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const target=document.querySelector('#app'),body=target.querySelector('.pp-cal-content');
      const visible=e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
      const outside=[...target.querySelectorAll('.pp-cal-header,.pp-cal-day-summary,.pp-cal-content,.pp-cal-event,.pp-cal-more')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.top< -1||r.right>innerWidth+1||r.bottom>innerHeight+1;}).map(e=>e.className);
      return {outside,bodyHeight:body.clientHeight,summary:!!target.querySelector('.pp-cal-day-summary'),icons:target.querySelectorAll('.pp-cal-event-icon').length};
    },{events,settings,view,color});
    assert.deepEqual(metrics.outside,[],`${view} ${width}x${height} ${color} stays within display`);
    assert.ok(metrics.bodyHeight>0);
    assert.ok(metrics.summary);
    results.push({view,width,height,color,...metrics});
  }
  // Dense lists must restore rows on a larger screen and be idempotent on repeated fitting.
  await page.setViewport({width:800,height:480});
  const render=async(extra={},items=events)=>page.evaluate(async({events,settings,extra})=>{
    const lib=window.PaperlessOpenIntegration;
    const layout=lib.renderCalendarLayout({target:'#app',events,now:settings.now,settings:{...settings,...extra}});
    await document.fonts.ready;lib.fitCalendarLayout(layout);
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    return [...document.querySelectorAll('.pp-cal-event')].filter(e=>e.getBoundingClientRect().height>0).length;
  },{events:items,settings,extra});
  const small=await render();
  await page.setViewport({width:1600,height:1200});
  await page.waitForFunction(n=>[...document.querySelectorAll('.pp-cal-event')].filter(e=>e.getBoundingClientRect().height>0).length>n,{},small);
  const idempotent=await page.evaluate(()=>{
    const metrics=()=>[...document.querySelectorAll('.pp-cal-event')].map(e=>[e.hidden,e.getBoundingClientRect().height]);
    const before=metrics();window.PaperlessOpenIntegration.fitCalendarLayout('#app');return JSON.stringify(before)===JSON.stringify(metrics());
  });
  assert.ok(idempotent,'Repeated fitting retains sizes and visible rows');
  const sizes={};
  for(const density of ['compact','comfortable','spacious','automatic']){
    await render({informationDensity:density},events.slice(0,1));
    sizes[density]=await page.$eval('.pp-cal-event-title',e=>parseFloat(getComputedStyle(e).fontSize));
  }
  assert.ok(sizes.compact<sizes.comfortable&&sizes.comfortable<sizes.spacious);
  assert.ok(sizes.automatic>sizes.comfortable,'Sparse automatic view enlarges text');
  await page.setViewport({width:800,height:480});
  await render({informationDensity:'automatic'},events.slice(0,1));
  const sparseFont=await page.$eval('.pp-cal-event-title',e=>parseFloat(getComputedStyle(e).fontSize));
  await render({informationDensity:'automatic'});
  const busyFont=await page.$eval('.pp-cal-event-title',e=>parseFloat(getComputedStyle(e).fontSize));
  assert.ok(sparseFont>busyFont,'Automatic density responds to measured content');
  await render({personalTitle:'Sehr lange persönliche Überschrift '.repeat(5),personalSubtitle:'Ein langer persönlicher Untertitel '.repeat(6),fontSize:150});
  assert.ok(await page.$eval('.pp-cal-content',e=>e.clientHeight>80),'Long header leaves space for appointments');
  await render({showHeader:false,showDaySummary:false,showEventIcons:false,informationDensity:'comfortable'});
  assert.equal(await page.$$eval('.pp-cal-header,.pp-cal-day-summary,.pp-cal-event-icon',n=>n.length),0,'All features can be disabled');
  assert.deepEqual(errors,[]);
  await writeFile(`${output}/results.json`,JSON.stringify({renders:results.length,results,resize:'passed',idempotent,sizes,longHeading:'passed',switches:'passed'},null,2)+'\n');
  console.log(JSON.stringify({renders:results.length,resize:'passed',idempotent,sizes,longHeading:'passed',switches:'passed'}));
} finally {await browser?.close();server.kill();}
