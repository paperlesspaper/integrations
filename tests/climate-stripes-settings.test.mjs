import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../', import.meta.url).pathname;
const html=await readFile(root+'applications/climate-stripes/settings.html','utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const runtime=await readFile(root+'public/paperless.iife.js','utf8');
const rows=JSON.parse(await readFile(root+'applications/climate-stripes/data/locations.json','utf8'));
const tick=()=>new Promise(r=>setImmediate(r));
async function scenario(messages){
 const elements=new Map();
 class Select {
  items=[];_value='';textContent='';
  replaceChildren(...items){this.items=items;this._value=items[0]?.value??'';}
  set value(v){this._value=this.items.some(i=>i.value===v)?v:'';}
  get value(){return this._value;}
  get selectedIndex(){return this.items.findIndex(i=>i.value===this._value);}
  set selectedIndex(i){this._value=this.items[i]?.value??'';}
 }
 const listeners=new Set();let release;const pending=new Promise(r=>release=r);const writes=[];
 const ctx=vm.createContext({console,setTimeout,clearTimeout,URL,URLSearchParams,Option:class{constructor(text,value){this.text=text;this.value=value;}},document:{documentElement:{},querySelector(id){if(!elements.has(id))elements.set(id,new Select());return elements.get(id);}},fetch:()=>pending});
 ctx.window=ctx;ctx.name='';ctx.parent={postMessage:m=>writes.push(m)};
 ctx.addEventListener=(kind,fn)=>{if(kind==='message')listeners.add(fn);};ctx.removeEventListener=(kind,fn)=>listeners.delete(fn);
 vm.runInContext(runtime,ctx);
 const b={...ctx.PaperlessOpenIntegration};ctx.PaperlessOpenIntegration=b;
 b.observeSettingsHeight=()=>{};
 b.loadLanguageJson=async payload=>({language:payload?.meta?.language??'en',messages:{region:'Region',country:'Country',location:'City'}});
 const run=vm.runInContext('(async()=>{'+script+'})()',ctx);
 for(const data of messages){for(const fn of [...listeners])fn({data,origin:'https://app.example'});await tick();}
 release({ok:true,json:async()=>rows});await run;await tick();
 return {location:elements.get('#location').value,language:ctx.document.documentElement.lang,automaticSettingsWrites:writes.filter(m=>m.type==='UPDATE_SETTINGS').length};
}
const saved={settings:{location:'europe/germany/berlin'},app:{language:'de'}};
const payload=location=>({type:'INIT',data:{meta:{pluginSettings:{location},language:'de'}}});
test('settings restore Berlin and German from actual app INIT and legacy messages', async()=>{
 assert.deepEqual(await scenario([{type:'INIT',payload:saved},{cmd:'message',data:saved}]), {location:'europe/germany/berlin',language:'de',automaticSettingsWrites:0});
});
test('settings support the preview payload without writing back on initialization', async()=>{
 assert.deepEqual(await scenario([payload('europe/germany/berlin')]), {location:'europe/germany/berlin',language:'de',automaticSettingsWrites:0});
});
test('latest location wins when the catalog resolves after several INIT messages', async()=>{
 assert.deepEqual(await scenario([payload('europe/germany/berlin'),payload('europe/germany/hamburg')]), {location:'europe/germany/hamburg',language:'de',automaticSettingsWrites:0});
});
test('app settings changes also survive delayed catalog loading', async()=>{
 assert.deepEqual(await scenario([{type:'INIT',payload:saved},{type:'INIT',payload:{settings:{location:'europe/germany/hamburg'},app:{language:'en'}}}]), {location:'europe/germany/hamburg',language:'en',automaticSettingsWrites:0});
});
