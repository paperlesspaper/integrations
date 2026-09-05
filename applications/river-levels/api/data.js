import {bool,getJson,envelope,retrievedAt,text,language} from '../../_shared/dashboard-api.js';
export function stationNames(value){const names=[...new Set(text(value||'KÖLN').split(/[,\n]/).map(x=>x.trim()).filter(Boolean))];if(!names.length||names.length>3||names.some(x=>x.length>100||! /^[\p{L}\p{N} ._()-]+$/u.test(x)))throw Error('Use one to three station names or UUIDs');return names;}
export function normalizeStation(data,de=true){
 if(!data?.longname || !Array.isArray(data.timeseries))throw Error('Invalid station response');
 const series=data.timeseries.find(x=>x.shortname==='W'),m=series?.currentMeasurement;
 const stamp=typeof m?.timestamp==='string'&&Number.isFinite(Date.parse(m.timestamp))?m.timestamp:'';
 return {title:String(data.longname).slice(0,100),value:typeof m?.value==='number'&&Number.isFinite(m.value)?m.value:null,unit:series?.unit||'',detail:String(data.water?.longname||''),stamp,tone:'blue',caption:de?'Pegel über Pegelnullpunkt':'Level above gauge zero'};
}
export async function loadRivers(query,fetchJson=getJson){
 const de=language(query)==='de',note=de?'Rohwerte · Pegelhöhe ist keine Wassertiefe':'Raw readings · gauge level is not water depth';
 if(bool(query.sampleData))return envelope({note,cards:[{title:'KÖLN · DEMO',value:238,unit:'cm',detail:'RHEIN',stamp:new Date().toISOString(),caption:de?'Pegel über Pegelnullpunkt':'Level above gauge zero',tone:'blue'},{title:'BONN · DEMO',value:192,unit:'cm',detail:'RHEIN',stamp:new Date().toISOString(),tone:'blue'}]},true,'PEGELONLINE · WSV');
 const names=stationNames(query.stations);
 const results=await Promise.allSettled(names.map(async name=>{const d=await fetchJson(`https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${encodeURIComponent(name)}.json?includeTimeseries=true&includeCurrentMeasurement=true`,{ttl:300000});return {card:normalizeStation(d,de),time:retrievedAt(d)};}));
 const ok=results.filter(x=>x.status==='fulfilled');if(!ok.length)throw Error('No stations available');
 return envelope({note,partial:ok.length<names.length,cards:results.map((r,i)=>r.status==='fulfilled'?r.value.card:{title:names[i],value:null,detail:de?'Messstelle nicht erreichbar':'Station unavailable',tone:'orange'})},false,'PEGELONLINE · WSV',ok.map(x=>x.value.time).sort()[0]);
}
export default async function handler({query}){return loadRivers(query);}
