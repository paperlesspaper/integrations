import {bool,getJson,envelope,baseUrl,required,text,language,number} from '../../_shared/dashboard-api.js';
export function normalizeDocuments(data,query){
 if(!Number.isInteger(data?.count)||data.count<0||!Array.isArray(data.results))throw Error('Invalid document response');
 const de=language(query)==='de';return {total:data.count,summary:`${data.count} ${de?'Dokumente':'documents'}${text(query.search)?(de?' · Suchergebnis':' · Search results'):''}`,note:de?'Zuletzt hinzugefügt · nur Metadaten':'Recently added · metadata only',cards:data.results.slice(0,Math.trunc(number(query.limit,4,1,6))).map(d=>({title:text(d.title).slice(0,140)||(de?'Ohne Titel':'Untitled'),value:'',detail:de?'Hinzugefügt':'Added',stamp:typeof d.added==='string'&&Number.isFinite(Date.parse(d.added))?d.added:'',tone:'green'}))};
}
export async function loadDocuments(query,fetchJson=getJson){
 if(bool(query.sampleData)){const de=language(query)==='de';return envelope(normalizeDocuments({count:128,results:(de?['Stromrechnung August','Garantie Fahrrad','Versicherungsunterlagen','Beleg Büromaterial']:['Electricity bill August','Bicycle warranty','Insurance documents','Office supplies receipt']).map((title,i)=>({title,added:new Date(Date.now()-i*86400000).toISOString()}))},query),true,'Paperless-ngx');}
 const url=new URL(`${baseUrl(query.baseUrl)}/api/documents/`);url.searchParams.set('page_size',String(Math.trunc(number(query.limit,4,1,6))));url.searchParams.set('ordering','-added');url.searchParams.set('fields','id,title,added,created');if(text(query.search))url.searchParams.set('query',text(query.search).slice(0,500));
 const data=await fetchJson(url.href,{headers:{Authorization:`Token ${required(query.token,'Token')}`}});return envelope(normalizeDocuments(data,query),false,'Paperless-ngx');
}
export default async function handler({query}){return loadDocuments(query);}
