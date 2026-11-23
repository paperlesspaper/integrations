import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { ditherImage, replaceColors, spectra6OriginalPalette, suggestCanvasProcessingOptions } from 'epdoptimize';

// Start a repository-root static server before running (default port 3378).
// Uses the user's Playwright CLI skill session, not the production integration.
const base=process.env.EVENT_DESIGN_ORIGIN || 'http://127.0.0.1:3378';
const output='output/playwright/event-calendar';
const cli=process.env.PLAYWRIGHT_CLI_PATH || `${process.env.HOME}/.codex/skills/playwright/scripts/playwright_cli.sh`;
const sizes=[[800,480],[480,800],[1600,1200],[1200,1600]];
const views=['magazine','program','spotlight'];
const themes=['blue-light','dark'];
await mkdir(output,{recursive:true});
const code=`async (page) => {
 const results=[];
 for(const [width,height] of ${JSON.stringify(sizes)}) for(const view of ${JSON.stringify(views)}) for(const color of ${JSON.stringify(themes)}) {
  const errors=[];const listener=e=>errors.push(e.message);page.on('pageerror',listener);
  await page.setViewportSize({width,height});
  await page.goto(${JSON.stringify(base)}+'/docs/event-calendar-concepts/render.html?view='+view+'&color='+color);
  await page.waitForSelector('html[data-ready=true]');
  const metrics=await page.evaluate(()=>{
    const overflow=[...document.querySelectorAll('#app,header,footer,section,article,h1,h2,h3,p,.note,.schedule,.facts,.spotlight-copy,.next-strip')].filter(e=>{
      const r=e.getBoundingClientRect();return r.width&&r.height&&(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5||e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2);
    }).map(e=>({element:e.className||e.tagName,text:e.textContent.slice(0,60),w:e.scrollWidth-e.clientWidth,h:e.scrollHeight-e.clientHeight}));
    return {overflow,failedImages:[...document.images].filter(e=>!e.naturalWidth).length};
  });
  const name=view+'-'+color+'-'+width+'x'+height;
  await page.screenshot({path:${JSON.stringify(output)}+'/'+name+'-raw.png'});
  page.off('pageerror',listener);results.push({name,width,height,view,color,...metrics,errors});
 }
 return results;
}`;
const result=spawnSync(cli,['--session','event-design','run-code',code],{encoding:'utf8',maxBuffer:4*1024*1024});
if(result.status!==0)throw new Error(result.stderr||result.stdout);
const metrics=JSON.parse(result.stdout.match(/### Result\n([\s\S]*?)\n### Ran/)?.[1]||'null');
if(!metrics)throw new Error(result.stdout);
await writeFile(`${output}/results.json`,JSON.stringify(metrics,null,2));
for(const row of metrics){
 const {name,width,height}=row;
 const source=createCanvas(width,height),dithered=createCanvas(width,height),device=createCanvas(width,height);
 source.getContext('2d').drawImage(await loadImage(`${output}/${name}-raw.png`),0,0);
 const options=suggestCanvasProcessingOptions(source,spectra6OriginalPalette,{intent:'readable'});
 await ditherImage(source,dithered,{...options.ditherOptions,palette:spectra6OriginalPalette,ditheringType:'errorDiffusion'});
 replaceColors(dithered,device,spectra6OriginalPalette);
 await writeFile(`${output}/${name}-epd.png`,device.toBuffer('image/png'));
}
const failures=metrics.filter(r=>r.overflow.length||r.errors.length||r.failedImages);
console.log(JSON.stringify({renders:metrics.length,failures},null,2));
if(failures.length)process.exitCode=1;
