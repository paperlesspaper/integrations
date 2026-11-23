import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const origin=process.env.CALENDAR_TEST_ORIGIN||'http://127.0.0.1:3380';
const output='output/playwright/event-image-sources';
await mkdir(output,{recursive:true});
const code=`async page => {
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const requestedPages=[];let imageRequests=0;
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="blue"/><circle cx="200" cy="150" r="90" fill="white"/></svg>';
  await page.route('https://images.example/**',async route=>{
    imageRequests++;
    if(route.request().url().includes('broken'))await route.fulfill({status:404,body:''});
    else await route.fulfill({contentType:'image/svg+xml',body:svg});
  });
  await page.route('**/api/event-images',async route=>{
    const urls=route.request().postDataJSON().urls;requestedPages.push(...urls);
    if(urls.includes('https://venue.example/slow'))await page.waitForTimeout(500);
    await route.fulfill({json:{images:[{url:'https://images.example/og.svg',source:'open-graph'}]}}).catch(()=>{});
  });
  const base={start:{dateTime:'2026-10-02T13:00:00+02:00'},end:{dateTime:'2026-10-02T14:00:00+02:00'}};
  const events=[
    {...base,id:'embedded',summary:'Bild in der Beschreibung',description:'<img src="https://images.example/embedded.svg">'},
    {...base,id:'website',summary:'Vorschau der Veranstaltungsseite',description:'<img src="https://images.example/broken.jpg"><a href="https://venue.example/event">Details</a>'},
    {...base,id:'attachment',summary:'Öffentlicher Bildanhang',attachments:[{mimeType:'image/png',fileUrl:'https://images.example/attachment'}]},
    {...base,id:'metadata',summary:'Explizites Veranstaltungsbild',extendedProperties:{shared:{ppImageUrl:'https://images.example/explicit.svg'}}},
    {...base,id:'outside',summary:'Außerhalb des Zeitraums',start:{date:'2027-01-01'},end:{date:'2027-01-02'},description:'https://venue.example/outside'},
  ];
  const inject=async data=>{
    await page.evaluate(events=>{document.querySelector('#website-has-loaded')?.remove();postMessage({type:'INIT',data:{events,meta:{language:'de'}}},location.origin);},data);
    await page.waitForSelector('#website-has-loaded',{state:'attached'});
  };
  const navigate=async settings=>{
    await page.goto(${JSON.stringify(origin)}+'/google-calendar/render.html?view=agenda-modern&now=2026-10-02T09:00:00Z&dayRange=3&maxEvents=8&'+settings);
    await page.waitForSelector('#website-has-loaded',{state:'attached'});
  };
  const results=[];
  for(const [width,height] of [[800,480],[480,800],[1600,1200],[1200,1600]]){
    await page.setViewportSize({width,height});await navigate('showEventImages=true');await inject(events);
    const count=await page.locator('.pp-cal-event-image').count();
    const loaded=await page.locator('.pp-cal-event-image').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0));
    if(count!==4||!loaded)throw Error('Expected four loaded images at '+width+'x'+height);
    await page.screenshot({path:${JSON.stringify(output)}+'/automatic-'+width+'x'+height+'.png'});
    results.push({size:width+'x'+height,images:count,loaded});
  }
  if(requestedPages.includes('https://venue.example/outside'))throw Error('Fetched an invisible event');
  await navigate('showEventImages=false');
  const beforeImages=imageRequests,beforePages=requestedPages.length;await inject(events);
  if(imageRequests!==beforeImages||requestedPages.length!==beforePages)throw Error('Images disabled still fetched sources');
  await navigate('showEventImages=true&eventImageSource=description');
  const beforeDescription=requestedPages.length;await inject(events);
  if(await page.locator('.pp-cal-event-image').count()!==1||requestedPages.length!==beforeDescription)throw Error('Description mode fetched extra sources');
  await navigate('showEventImages=true');
  const slowRequest=page.waitForRequest(r=>r.url().includes('/api/event-images'));
  await page.evaluate(event=>{document.querySelector('#website-has-loaded')?.remove();postMessage({type:'INIT',data:{events:[event]}},location.origin);},{...base,id:'old',summary:'Alter Termin',description:'https://venue.example/slow'});
  await slowRequest;
  await inject([{...base,id:'new',summary:'Neuer Termin'}]);
  await page.waitForTimeout(600);
  const content=await page.locator('#app').textContent();
  if(content.includes('Alter Termin')||!content.includes('Neuer Termin'))throw Error('Stale render overwrote update');
  if(errors.length)throw Error(errors.join('; '));
  return {renders:results,disabled:'passed',descriptionOnly:'passed',visibleRange:'passed',staleUpdate:'passed',errors};
}`;
const cli=process.env.PLAYWRIGHT_CLI_PATH||`${process.env.HOME}/.codex/skills/playwright/scripts/playwright_cli.sh`;
const result=spawnSync(cli,['--session','event-images','run-code',code],{encoding:'utf8',maxBuffer:4*1024*1024});
const json=result.stdout.match(/### Result\n([\s\S]*?)\n### Ran/)?.[1];
if(result.status||!json)throw Error(result.stderr||result.stdout);
await writeFile(`${output}/results.json`,json+'\n');console.log(json);
