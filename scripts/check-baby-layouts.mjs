import { spawn } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { parseDate, addMonths, DAY, illustrationFor } from '../applications/baby/data/model.js';
const config=JSON.parse(await readFile('applications/baby/config.json','utf8'));
const data=JSON.parse(await readFile('applications/baby/data/development.json','utf8'));
const port=Number(process.env.BABY_TEST_PORT || 3346);
const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:String(port)},stdio:'pipe'});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const results=[];
const iso=day=>new Date(day*DAY).toISOString().slice(0,10);
const today=parseDate('2026-09-22');
await mkdir('output/baby',{recursive:true});
try {
  for(let i=0;i<50;i++){try{if((await fetch(`http://127.0.0.1:${port}/health`)).ok)break;}catch{} await new Promise(r=>setTimeout(r,100));}
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/baby/`,{waitUntil:'networkidle0'});
  await page.waitForSelector('#website-has-loaded');
  async function render(settings,language='de') {
    await page.evaluate(async ({settings,config,language})=>{
      await new Promise((resolve,reject)=>{
        let loading=false;
        const timeout=setTimeout(()=>{observer.disconnect();reject(new Error('Render timeout'));},15000);
        const observer=new MutationObserver(()=>{
          if(!document.querySelector('#website-has-loaded'))loading=true;
          if(loading && document.querySelector('#website-has-loaded') && document.documentElement.dataset.paperlessRenderStatus === 'ready') {clearTimeout(timeout);observer.disconnect();resolve();}
          if(document.documentElement.dataset.paperlessRenderStatus === 'error') {clearTimeout(timeout);observer.disconnect();reject(new Error('Render error'));}
        });
        observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true});
        postMessage({type:'INIT',data:{meta:{language,pluginManifest:config,pluginSettings:settings}}},location.origin);
      });
    },{settings:{...config.nativeSettings,referenceDate:'2026-09-22',...settings},config,language});
  }
  for(const [width,height] of [[800,480],[480,800]]) {
    await page.setViewport({width,height});
    for(const language of ['de','en']) for(const imageStyle of ['illustrated','classic']) for(const extras of [false,true]) {
      const cases=[...data.pregnancy.map(r=>({id:r.id,dueDate:iso(today+280-r.week*7)})),...data.child.map(r=>({id:r.id,birthDate:iso(addMonths(today,-r.month))}))];
      for(const [index,c] of cases.entries()) {
        await render({...c,dailyContent:false,imageStyle,showAgeDetails:extras,showNotes:extras,showSources:extras,showProgress:extras,showDate:extras,color:index%2?'dark':'green-light',textSize:'big'},language);
        const metrics=await page.evaluate(()=>{
          const app=document.querySelector('#app');
          const overflow=[...app.querySelectorAll('*'),app].filter(el=>el.clientWidth>0 && (el.scrollWidth>el.clientWidth+2 || el.scrollHeight>el.clientHeight+2)).map(el=>({el:el.className||el.tagName,w:el.scrollWidth-el.clientWidth,h:el.scrollHeight-el.clientHeight}));
          const bottom=app.querySelector('.content')?.getBoundingClientRect().bottom;
          const footer=app.querySelector('.footer')?.getBoundingClientRect().top ?? app.getBoundingClientRect().bottom;
          const facts=app.querySelector('.facts')?.getBoundingClientRect();
          const tip=app.querySelector('.tip')?.getBoundingClientRect();
          return {entry:app.dataset.entry,imageSrc:app.querySelector('.art img')?.getAttribute('src'),overflow,overlap:bottom>footer+1 || (facts&&tip&&facts.bottom>tip.top+1),images:[...app.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0)};
        });
        results.push({case:c.id,imageStyle,extras,language,width,height,...metrics});
        assert.equal(metrics.entry,c.id);
        const entry=[...data.pregnancy,...data.child].find(r=>r.id===c.id);
        assert.equal(metrics.imageSrc,`./assets/${illustrationFor(entry,imageStyle)}.png`);
        assert.ok(metrics.images,`${c.id}: image missing`);
      }
    }
  }
  // Render every editorial card, both languages and orientations, with all extras.
  for (const [width,height] of [[800,480],[480,800]]) {
    await page.setViewport({width,height});
    for (const language of ['de','en']) for (const entry of [...data.pregnancy,...data.child]) {
      for (const [index,card] of entry.daily.entries()) {
        const pregnancy=entry.week!=null;
        const settings=pregnancy
          ? {dueDate:'2026-09-22',referenceDate:iso(today-280+entry.week*7+index)}
          : {birthDate:'2020-01-15',referenceDate:iso(addMonths(parseDate('2020-01-15'),entry.month)+index)};
        await render({...settings,dailyContent:true,imageStyle:index%2?'classic':'illustrated',color:index%2?'dark':'blue-light',showAgeDetails:true,showNotes:true,showSources:true,showProgress:true,textSize:'big'},language);
        const metrics=await page.evaluate(()=>{
          const app=document.querySelector('#app');
          return {daily:app.dataset.daily,overflow:[...app.querySelectorAll('*'),app].filter(el=>el.clientWidth>0&&(el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2)).map(el=>({el:el.className||el.tagName,w:el.scrollWidth-el.clientWidth,h:el.scrollHeight-el.clientHeight})),text:app.querySelector('.description').textContent,tip:!!app.querySelector('.tip')};
        });
        assert.equal(metrics.daily,card.id);
        assert.equal(metrics.text,card.text[language]);
        assert.equal(metrics.tip,card.kind!=='activity');
        results.push({case:card.id,language,width,height,overflow:metrics.overflow});
      }
    }
    // Intermediate images coexist with the earlier, evidence-based milestone record.
    for(const art of data.childIllustrations) for(const imageStyle of ['illustrated','classic']) {
      await render({birthDate:'2020-01-15',referenceDate:iso(addMonths(parseDate('2020-01-15'),art.month)),imageStyle});
      assert.equal(await page.$eval('.art img',e=>e.getAttribute('src')),`./assets/${illustrationFor(art,imageStyle)}.png`);
    }
  }
  // Edge cases: long name, corrected age, large devices, safe HTML, empty/error states.
  for(const [width,height] of [[800,480],[480,800],[1600,1200],[1200,1600]]) {
    await page.setViewport({width,height});
    await render({birthDate:'2026-03-22',prematureWeeks:8,childName:'Alexandermil Maximiliansommer Sonnenschein',textSize:'big',color:'blue-dark'});
    results.push({case:'long-name-correction',width,height,...await page.evaluate(()=>({overflow:[...document.querySelectorAll('#app *')].filter(el=>el.clientWidth>0&&(el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2)).map(el=>({el:el.className,w:el.scrollWidth-el.clientWidth,h:el.scrollHeight-el.clientHeight}))}))});
  }
  await render({childName:'<img src=x onerror=alert(1)>',demo:true});
  assert.equal(await page.$eval('.name',e=>e.children.length),0);
  await render({demo:true,demoStage:'pregnancy',demoPregnancyWeek:8,imageStyle:'classic'});
  assert.equal(await page.$eval('.art img',e=>e.getAttribute('src')),'./assets/classic-week-08.png');
  assert.match(await page.$eval('.age',e=>e.textContent),/8\+0/);
  await render({demo:true,demoStage:'pregnancy',demoPregnancyWeek:36,imageStyle:'illustrated'});
  assert.equal(await page.$eval('.art img',e=>e.getAttribute('src')),'./assets/illustrated-week-36.png');
  for(const settings of [{},{birthDate:'2027-01-01'},{dueDate:'2026-01-01'},{birthDate:'2020-01-01'},{referenceDate:'invalid'},{dueDate:'2027-06-29'}]) await render(settings);
  // Optional information must disappear without retaining empty header/footer space.
  for(const [width,height] of [[800,480],[480,800]]) {
    await page.setViewport({width,height});
    await render({demo:true,demoStage:'pregnancy',demoPregnancyWeek:32,referenceDate:'',showTip:'false',showIllustration:'false',showMeasurements:'false',showAgeDetails:'false',showProgress:'false',showSources:'false',showNotes:'false',showDate:'false'});
    for(const selector of ['.art','.tip','.measurement','.age-detail','.progress','.footer','time','figcaption','.brand']) assert.equal(await page.$(selector),null,selector+' should be absent');
    assert.ok(await page.$('.badge'),'Demo remains labelled');
    assert.equal(await page.$eval('.content',el=>el.getBoundingClientRect().bottom<=innerHeight),true);
    await render({demo:true,demoStage:'pregnancy',demoPregnancyWeek:32,dailyContent:false,showTip:true,showIllustration:true,showMeasurements:true,showAgeDetails:true,showProgress:true,showSources:true,showNotes:true,showDate:true});
    for(const selector of ['.art','.tip','.measurement','.age-detail','.progress','.footer','.sources','time']) assert.ok(await page.$(selector),selector+' should return');
    const text=await page.$eval('#app',el=>el.textContent);
    assert.ok(!/KLEIN WIRD GROSS|Quellen geprüft|maßstabsgetreu|Illustration ab SSW/.test(text));
    await render({dueDate:'2026-12-01',referenceDate:''});
    assert.equal(await page.$('.header'),null,'Real calendar has no default header');
    assert.equal(await page.$('.footer'),null,'Real calendar has no default footer');
  }
  // Image failure must settle; a later INIT must restore a healthy image.
  await page.setRequestInterception(true);
  const intercept=r=>r.url().endsWith('month-60.png')?r.abort():r.continue();
  page.on('request',intercept);
  await page.setCacheEnabled(false);
  await render({birthDate:'2021-09-22'});
  assert.ok(await page.$('.image-fallback'));
  page.off('request',intercept);
  await page.setRequestInterception(false);
  await render({demo:true});
  assert.ok(await page.$('.art img'));
  assert.deepEqual(errors,[]);
  const failed=results.filter(r=>r.overflow?.length||r.overlap);
  await writeFile('output/baby/layout-results.json',JSON.stringify({checked:results.length,failed,results},null,2));
  console.log(JSON.stringify({checked:results.length,failedCount:failed.length,examples:failed.slice(0,8)},null,2));
  assert.equal(failed.length,0,'Content must fit without clipping or overlap');
} finally {await browser.close();server.kill();}
