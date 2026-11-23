import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { ditherImage, replaceColors, spectra6OriginalPalette, suggestCanvasProcessingOptions } from 'epdoptimize';

// Repository screenshots use synthetic fixtures, never personal calendar data.
const output='output/playwright/calendar-repository';
const published='docs/screenshots/calendars';
const providers=['google-calendar','apple-calendar','outlook-calendar','nextcloud-calendar','proton-calendar','caldav','webcal'];
const sizes=[[800,480],[480,800],[1600,1200],[1200,1600]];
const themes=['blue-light','dark'];
const views=['agenda','agenda-modern','today-next','day','three-days','week','rolling-week-list','rolling-week','year','day-timeline'];
const labels={'day-timeline':'Day timeline (minimal)',agenda:'Agenda (classic)','agenda-modern':'Agenda (modern)','today-next':'Today & next',day:'Day','three-days':'3 days',week:'Calendar week','rolling-week-list':'Next 7 days (list)','rolling-week':'Next 7 days (time grid)',year:'Year',icons:'Icon shortcodes',images:'Automatic event images','icons-and-images':'Icons + images',magazine:'Event magazine · concept',program:'Event programme · concept',spotlight:'Event poster · concept'};
const origin='http://127.0.0.1:3390',staticOrigin='http://127.0.0.1:3391';
const now='2026-07-24T10:00:00Z';
const timed=(id,summary,day,time,end,location,color='#0000ff')=>({id,summary,location,color,start:{dateTime:`2026-07-${day}T${time}:00+02:00`},end:{dateTime:`2026-07-${day}T${end}:00+02:00`}});
const fixture=[
  timed('1','Teamfrühstück',24,'09:30','10:00','Büro · Küche'),
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
  timed('12','Telefonat',30,'09:30','10:30','Online','#ff0000'),
];
const timelineFixture=[
  timed('tl1','[icon:work] Projektplanung',24,'09:00','10:00','Studio 2','#0000ff'),
  timed('tl2','Design besprechen',24,'10:30','11:30','Besprechungsraum','#0000ff'),
  timed('tl3','[icon:coffee] Mittagspause',24,'12:30','13:15','Café am Park','#00ff00'),
  timed('tl4','[icon:meeting] Team-Workshop',24,'14:00','15:30','Werkstatt','#0000ff'),
  timed('tl5','Telefonat',24,'14:30','15:00','Online','#ff0000'),
  timed('tl6','[icon:music] Konzert im Hof',24,'19:00','21:00','Kulturhof','#00ff00'),
  timed('tl7','[todo] Entwurf verschicken',24,'16:00','16:00',''),
  timed('tl8','[todo] Tickets reservieren',24,'18:00','18:00',''),
  timed('tl9','[todo] Reisekosten abgeben',24,'23:59','23:59',''),
];
const featureFixture=[
  {...timed('concert','[icon:meeting] Jazz im Hof',24,'19:30','22:00','Kulturhof · Innenhof'),description:'<img src="https://calendar-preview.example/jazz.svg">'},
  {...timed('market','[icon:shopping] Designmarkt',25,'10:00','17:00','Alte Fabrik'),description:'Details: https://calendar-preview.example/market'},
  {...timed('cinema','[icon:video] Kino unter Sternen',25,'20:15','22:30','Stadtgarten'),attachments:[{mimeType:'image/svg+xml',fileUrl:'https://calendar-preview.example/cinema.svg'}]},
  timed('art','[icon:school] Offenes Atelier',26,'11:00','13:00','Kulturhof · Studio 4'),
];
const personalSettings={view:'agenda-modern',color:'blue-light',now,dayRange:7,maxEvents:30,showDaySummary:true,automaticEventIcons:true,showEventIcons:true,showEventImages:false,personalTitle:'Unsere Woche',personalSubtitle:'Familie Müller · Gemeinsam geplant',informationDensity:'automatic'};
const personalVariants=[
  ['day-at-glance','Tag auf einen Blick',{...personalSettings,view:'today-next'},fixture],
  ['automatic-icons','Automatische Icons',{...personalSettings,showDaySummary:false,personalTitle:'Unsere Termine'},fixture],
  ['personal-header','Persönlicher Kopfbereich',{...personalSettings,showDaySummary:false,automaticEventIcons:false},fixture],
  ['density-sparse','Automatik · wenige Termine',personalSettings,fixture.slice(1,3)],
  ['density-busy','Automatik · viele Termine',personalSettings,fixture],
  ['density-compact','Dichte · kompakt',{...personalSettings,informationDensity:'compact'},fixture],
  ['density-spacious','Dichte · großzügig',{...personalSettings,informationDensity:'spacious'},fixture]
];
const manifestUpdates=new Map();
const jobs=[];
for(const [view,label,settings,events] of personalVariants)for(const [width,height] of sizes)for(const color of themes)jobs.push({group:'personal',view,label,width,height,color,slug:'google-calendar',settings:{...settings,color},events});
for(const view of views)for(const [width,height] of sizes)for(const color of themes)jobs.push({group:'views',view,label:labels[view],width,height,color,slug:'google-calendar',settings:{view,color,now,dayRange:7,maxEvents:12,showEventIcons:view==='day-timeline',showEventImages:false,...(view==='day-timeline'?{now:'2026-07-24T12:45:00Z'}:{})},events:view==='day-timeline'?timelineFixture:fixture});
for(const feature of ['icons','images','icons-and-images'])for(const [width,height] of sizes)for(const color of themes)jobs.push({group:'features',view:feature,label:labels[feature],width,height,color,slug:'google-calendar',settings:{view:'agenda-modern',color,now,dayRange:7,maxEvents:12,showEventIcons:feature!=='images',showEventImages:feature!=='icons'},events:featureFixture});
for(const view of ['magazine','program','spotlight'])for(const [width,height] of sizes)for(const color of themes)jobs.push({group:'concepts',view,label:labels[view],width,height,color});
for(const slug of providers){
  const path=`applications/${slug}/config.json`, config=JSON.parse(await readFile(path,'utf8'));
  manifestUpdates.set(path,config);
  for(const [index,variant] of config.configVariants.entries())for(const [width,height] of sizes){
    const view=variant.view||'agenda',color=variant.color||'light';
    const oldPath=variant.screenshots?.['800x480'];
    const stem=oldPath?oldPath.replace(/^\.\/screenshots\//,'').replace(/800x480-landscape\.png$/,''):`${slug}-${view}-`;
    const name=`${stem}${width}x${height}-${width>height?'landscape':'portrait'}.png`;
    variant.screenshots={...variant.screenshots,[`${width}x${height}`]:`./screenshots/${name}`};
    const settings={};
    for(const key of ['view','color','locale','timeZone','dayRange','maxEvents','highlightToday','highlightScale','showLocation','showEventIcons','showEventImages','now','fontSize'])if(variant[key]!==undefined)settings[key]=variant[key];
    settings.now ||= now;
    const dayShift=Math.round((Date.parse(settings.now.slice(0,10))-Date.parse('2026-07-24'))/86400000);
    const shift=stamp=>{if(!stamp)return undefined;const d=new Date(stamp);d.setUTCDate(d.getUTCDate()+dayShift);return stamp.length===10?d.toISOString().slice(0,10):d.toISOString();};
    const events=fixture.map(e=>({...e,start:{date:shift(e.start.date),dateTime:shift(e.start.dateTime)},end:{date:shift(e.end?.date),dateTime:shift(e.end?.dateTime)}}));
    jobs.push({group:'providers',view:`${slug}-${view}-${index+1}`,label:`${config.name} · ${labels[view]}`,width,height,color,slug,settings,events,catalogPath:`applications/${slug}/screenshots/${name}`});
  }
}
await mkdir(output,{recursive:true});
for(const group of ['views','features','concepts','providers','personal'])await mkdir(`${published}/${group}`,{recursive:true});
const requestedView=process.argv.find(arg=>arg.startsWith('--view='))?.slice(7);
const requestedGroup=process.argv.find(arg=>arg.startsWith('--group='))?.slice(8);
const selectedJobs=jobs.filter(job=>(!requestedView||(job.settings?.view||job.view)===requestedView)&&(!requestedGroup||job.group===requestedGroup));
assert.ok(selectedJobs.length,'At least one matching screenshot view');
const previousResults=(requestedView||requestedGroup)?JSON.parse(await readFile(`${published}/results.json`,'utf8')):[];
const providerServer=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'3390'},stdio:'pipe'});
const staticServer=spawn('python3',['-m','http.server','3391','--bind','127.0.0.1'],{stdio:'pipe'});
const results=[];
let browser;
try{
  for(const url of [`${origin}/health`,`${staticOrigin}/docs/event-calendar-concepts/render.html`]){
    let ready=false;
    for(let i=0;i<60;i++){try{if((await fetch(url)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
    assert.ok(ready,'Screenshot server started');
  }
  browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const page=await browser.newPage();
  await page.emulateTimezone('Europe/Berlin');
  let job,errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request',async request=>{
    const url=new URL(request.url());
    try{
      if(url.hostname==='calendar-preview.example'){
        const asset=url.pathname.includes('cinema')?'cinema.svg':url.pathname.includes('market')?'market.svg':'jazz.svg';
        await request.respond({status:200,contentType:'image/svg+xml',body:await readFile(`docs/event-calendar-concepts/assets/${asset}`)});
      }else if(url.pathname.endsWith('/api/event-images')){
        await request.respond({status:200,contentType:'application/json',body:JSON.stringify({images:[{url:'https://calendar-preview.example/market.svg',source:'open-graph'}]})});
      }else if(url.pathname.endsWith('/api/data')){
        const events=job.events.map(e=>({...e,title:e.summary}));
        await request.respond({status:200,contentType:'application/json',body:JSON.stringify({events,calendarName:'Beispielkalender',sample:true})});
      }else await request.continue();
    }catch(error){errors.push(error.message);if(!request.isInterceptResolutionHandled())await request.abort();}
  });
  for(const nextJob of selectedJobs){
    job=nextJob;errors=[];
    const {group,view,width,height,color}=job;
    const name=`${view}-${color}-${width}x${height}`;
    await page.setViewport({width,height});
    if(group==='concepts'){
      await page.goto(`${staticOrigin}/docs/event-calendar-concepts/render.html?view=${view}&color=${color}`,{waitUntil:'load'});
      await page.waitForSelector('html[data-ready=true]');
    }else{
      const query=new URLSearchParams({...job.settings,locale:job.settings.locale||'de-DE',timeZone:'Europe/Berlin'});
      await page.goto(`${origin}/${job.slug}/render.html?${query}`,{waitUntil:'load'});
      await page.waitForSelector('#website-has-loaded');
      if(job.slug==='google-calendar'){
        await page.evaluate(events=>{document.querySelector('#website-has-loaded')?.remove();postMessage({type:'INIT',data:{events,meta:{language:'de'}}},location.origin);},job.events);
        await page.waitForSelector('#website-has-loaded');
      }
    }
    await page.evaluate(()=>document.fonts.ready);
    const metrics=await page.evaluate(()=>{
      const visible=e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
      const images=[...document.images].filter(visible);
      const icons=[...document.querySelectorAll('.pp-cal-event-icon i, .pp-cal-event-icon svg')].filter(visible);
      const wrappedLabels=[...document.querySelectorAll('.pp-cal--view-agenda-modern .pp-cal-modern-date p,.pp-cal--view-agenda-modern .pp-cal-event-time')].filter(e=>{
        if(!visible(e))return false;
        // Grid items stretch vertically; measure text lines instead of the item's box.
        const range=document.createRange();range.selectNodeContents(e);
        return new Set([...range.getClientRects()].filter(r=>r.width>0).map(r=>Math.round(r.top))).size>1;
      }).map(e=>e.textContent);
      return {status:document.documentElement.dataset.paperlessRenderStatus||document.documentElement.dataset.ready,images:images.length,failedImages:images.filter(i=>!i.complete||!i.naturalWidth).length,icons:icons.length,missingIconArt:icons.filter(i=>i.tagName.toLowerCase()!=='svg'&&getComputedStyle(i,'::before').maskImage==='none'&&getComputedStyle(i,'::before').webkitMaskImage==='none').length,wrappedLabels,text:document.querySelector('#app')?.textContent.slice(0,100)};
    });
    assert.ok(['ready','true'].includes(metrics.status),name+' is ready');
    assert.deepEqual(errors,[],name+' browser errors');
    assert.equal(metrics.failedImages,0,name+' images loaded');
    if(job.settings?.view==='agenda-modern'&&width>height&&group!=='personal')assert.deepEqual(metrics.wrappedLabels,[],name+' keeps dates and times on one line');
    if(group==='personal'){assert.equal(await page.locator('.pp-cal-title').map(e=>e.textContent).wait(),job.settings.personalTitle);assert.equal(metrics.missingIconArt,0,name+' icon artwork loaded');}
    if(group==='features'&&view!=='images'){assert.ok(metrics.icons>0,name+' has icons');assert.equal(metrics.missingIconArt,0,name+' icon artwork loaded');}
    if(group==='features'&&view!=='icons')assert.ok(metrics.images>0,name+' has images');
    const rawPath=`${output}/${name}-raw.png`;
    const raw=await page.screenshot({path:rawPath});
    const src=createCanvas(width,height),dithered=createCanvas(width,height),epd=createCanvas(width,height);
    src.getContext('2d').drawImage(await loadImage(raw),0,0);
    const options=suggestCanvasProcessingOptions(src,spectra6OriginalPalette,{intent:'readable'});
    await ditherImage(src,dithered,{...options.ditherOptions,palette:spectra6OriginalPalette,ditheringType:'errorDiffusion'});
    replaceColors(dithered,epd,spectra6OriginalPalette);
    const epdPath=`${output}/${name}-epd.png`;
    await writeFile(epdPath,epd.toBuffer('image/png'));
    const relative=`${group}/${name}`;
    await copyFile(rawPath,`${published}/${relative}-raw.png`);
    await copyFile(epdPath,`${published}/${relative}-epd.png`);
    if(job.catalogPath){await mkdir(job.catalogPath.slice(0,job.catalogPath.lastIndexOf('/')),{recursive:true});await copyFile(epdPath,job.catalogPath);}
    results.push({group,view,label:job.label,width,height,color,path:relative,...metrics});
    console.log(`[${results.length}/${selectedJobs.length}] ${relative}`);
  }
  const renderedCount=results.length;
  if(requestedView||requestedGroup){
    const merged=new Map(previousResults.map(row=>[row.path,row]));
    for(const row of results)merged.set(row.path,row);
    results.splice(0,results.length,...merged.values());
  }
  for(const [path,config] of manifestUpdates)await writeFile(path,JSON.stringify(config,null,2)+'\n');
  await writeFile(`${published}/results.json`,JSON.stringify(results,null,2)+'\n');
  await writeFile(`${published}/fixtures.json`,JSON.stringify({now,events:fixture,features:featureFixture,timeline:timelineFixture,notes:'Synthetic fixture metadata API and public image URLs are intercepted by the renderer. No live calendar accounts are used.'},null,2)+'\n');
  const summary=createCanvas(1600,1100),ctx=summary.getContext('2d');ctx.fillStyle='#e9ede9';ctx.fillRect(0,0,1600,1100);ctx.fillStyle='#17201d';ctx.font='bold 32px Arial';ctx.fillText('Calendar views · 7.3-inch display',28,47);
  for(const [index,view] of ['agenda-modern','today-next','rolling-week-list','rolling-week'].entries()){
    const x=28+(index%2)*786,y=82+Math.floor(index/2)*505;
    ctx.fillStyle='#17201d';ctx.font='bold 21px Arial';ctx.fillText(labels[view],x,y+24);
    ctx.drawImage(await loadImage(`${published}/views/${view}-blue-light-800x480-epd.png`),x,y+43,758,455);
  }
  await writeFile(`${published}/overview.png`,summary.toBuffer('image/png'));
  console.log(JSON.stringify({renders:renderedCount,publishedPNGs:results.length*2+1,catalogPNGs:results.filter(r=>r.group==='providers').length}));
}finally{await browser?.close();providerServer.kill();staticServer.kill();}
