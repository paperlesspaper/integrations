import { bool, getJson, envelope, retrievedAt, language, text } from '../../_shared/dashboard-api.js';
const finite = v => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
export function aqiBand(value) { return finite(value) === null ? null : [20,40,60,80,100].findIndex(x=>value<=x) === -1 ? 5 : [20,40,60,80,100].findIndex(x=>value<=x); }
export function normalizeAir(data, query) {
 const de=language(query)==='de', c=data?.current;
 if(!c || !Number.isFinite(c.time)) throw Error('Invalid air-quality response');
 const aqi=finite(c.european_aqi), band=aqiBand(aqi);
 const labels=de?['Gut','Akzeptabel','Mäßig','Schlecht','Sehr schlecht','Extrem schlecht']:['Good','Fair','Moderate','Poor','Very poor','Extremely poor'];
 const next=(data.hourly?.time||[]).flatMap((ts,i)=>ts>c.time&&ts<=c.time+6*3600&&finite(data.hourly.european_aqi?.[i])!==null?[data.hourly.european_aqi[i]]:[]);
 return { summary: `${text(query.locationName)||'Berlin'} · ${de?'Europäischer AQI':'European AQI'}`, note:de?'CAMS-Modellwerte · keine lokale Sensormessung':'CAMS model estimates · not a local sensor reading', cards:[
 {title:de?'Luftqualität jetzt':'Air quality now',value:aqi,detail:band===null?(de?'Nicht verfügbar':'Unavailable'):labels[band],tone:band===null?'blue':band<2?'green':band<4?'orange':'red',stamp:new Date(c.time*1000).toISOString()},
 ...[['PM₂.₅','pm2_5'],['PM₁₀','pm10']].map(([title,key])=>({title,value:finite(c[key]),unit:'µg/m³'})),
 {title:de?'Höchster AQI · nächste 6 h':'Highest AQI · next 6 h',value:next.length?Math.max(...next):null,detail:de?'Stündliche Prognose':'Hourly forecast',tone:'orange'}]};
}
export async function loadAir(query, fetchJson=getJson) {
 const sample=bool(query.sampleData);
 if(sample){const time=Math.floor(Date.now()/3600000)*3600;return envelope(normalizeAir({current:{time,european_aqi:32,pm2_5:8.6,pm10:16.2},hourly:{time:[time+3600,time+7200],european_aqi:[35,42]}},query),true,'Open-Meteo · CAMS');}
 const latitude=Number(query.latitude??52.52),longitude=Number(query.longitude??13.405);
 if(query.latitude===''||query.longitude===''||!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180)throw Error('Invalid coordinates');
 const key=text(query.apiKey);const url=new URL(key?'https://customer-air-quality-api.open-meteo.com/v1/air-quality':'https://air-quality-api.open-meteo.com/v1/air-quality');
 for(const [k,v] of Object.entries({latitude,longitude,current:'european_aqi,pm2_5,pm10',hourly:'european_aqi',forecast_days:2,timeformat:'unixtime',timezone:'UTC',...(key?{apikey:key}:{})}))url.searchParams.set(k,String(v));
 const data=await fetchJson(url.href,{ttl:1800000});return envelope(normalizeAir(data,query),false,'Open-Meteo · CAMS',retrievedAt(data));
}
export default async function handler({query}) {return loadAir(query);}
