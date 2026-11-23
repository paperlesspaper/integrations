import { parse } from 'parse5';
import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { publicAddress } from './dashboard-api.js';
import { webUrl } from '../google-calendar/assets/event-images.js';

// Stable module cache survives the API handler's per-request dynamic import.
const cache = new Map();
const inflight = new Map();
const MAX_HTML_BYTES = 512 * 1024;

export async function publicTarget(value, lookupImpl = lookup) {
  const normalized = webUrl(value);
  if (!normalized) throw new Error('Invalid public page URL');
  const url = new URL(normalized), host = url.hostname.replace(/^\[|\]$/g, '');
  if ((url.port && !['80','443'].includes(url.port)) || host === 'localhost' || host.endsWith('.localhost')) throw new Error('Non-public page');
  const addresses = isIP(host) ? [{address:host, family:isIP(host)}] : await lookupImpl(host, {all:true});
  if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw new Error('Non-public page');
  return { url, address:addresses[0] };
}

export async function fetchImagePage(value, { timeoutMs = 4500, lookupImpl = lookup, requestImpl } = {}) {
  const deadline = Date.now() + timeoutMs;
  let current = value;
  for (let redirect=0; redirect<=3; redirect++) {
    let dnsTimer;
    const target = await Promise.race([
      publicTarget(current, lookupImpl),
      new Promise((_, reject) => { dnsTimer=setTimeout(()=>reject(new Error('Page timeout')), Math.max(1, deadline-Date.now())); }),
    ]).finally(()=>clearTimeout(dnsTimer));
    if (Date.now() >= deadline) throw new Error('Page timeout');
    const { url, address } = target;
    const response = await new Promise((resolve, reject) => {
      const request = requestImpl || (url.protocol==='https:' ? httpsRequest : httpRequest);
      const req = request(url, {
        agent:false,
        headers:{Accept:'text/html,application/xhtml+xml', 'Accept-Encoding':'identity', 'User-Agent':'paperlesspaper-event-images/1.0'},
        lookup:(_host, options, cb) => options.all ? cb(null,[address]) : cb(null,address.address,address.family),
      }, res => {
        const status = res.statusCode;
        if ([301,302,303,307,308].includes(status) && res.headers.location) {
          res.destroy();
          resolve({location:res.headers.location});
          return;
        }
        if (status<200 || status>=300 || !/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(res.headers['content-type']||'')) {
          res.destroy(); reject(new Error('Page is not HTML')); return;
        }
        if (Number(res.headers['content-length'])>MAX_HTML_BYTES) {
          res.destroy(); reject(new Error('Page too large')); return;
        }
        const chunks=[]; let size=0;
        res.on('error',reject);
        res.on('data',chunk=>{
          size+=chunk.length;
          if(size>MAX_HTML_BYTES){res.destroy();reject(new Error('Page too large'));}
          else chunks.push(chunk);
        });
        res.on('end',()=>resolve({html:Buffer.concat(chunks).toString('utf8'),url:url.href}));
      });
      const timer=setTimeout(()=>req.destroy(new Error('Page timeout')), Math.max(1,deadline-Date.now()));
      req.on('error',reject);req.on('close',()=>clearTimeout(timer));req.end();
    });
    if (!response.location) return response;
    current = new URL(response.location, url).href;
  }
  throw new Error('Too many redirects');
}

export function extractPageImages(html, pageUrl) {
  const tree=parse(String(html).slice(0,MAX_HTML_BYTES));
  const nodes=[], stack=[tree];
  while(stack.length){const node=stack.pop();nodes.push(node);stack.push(...(node.childNodes||[]).slice().reverse());}
  const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'';
  const base=webUrl(attr(nodes.find(n=>n.tagName==='base')||{},'href'),pageUrl)||pageUrl;
  const groups={og:[],twitter:[],structured:[],microdata:[]};
  const add=(group,value,source)=>{
    const url=webUrl(value,base);
    if(url)groups[group].push({url,source,pageUrl});
  };
  for(const node of nodes){
    if(node.tagName==='meta'){
      const key=(attr(node,'property')||attr(node,'name')).toLowerCase();
      if(['og:image','og:image:url','og:image:secure_url'].includes(key))add('og',attr(node,'content'),'open-graph');
      if(['twitter:image','twitter:image:src'].includes(key))add('twitter',attr(node,'content'),'twitter-card');
    }
    if(attr(node,'itemprop').split(/\s+/).includes('image'))add('microdata',attr(node,'content')||attr(node,'href')||attr(node,'src'),'microdata');
    if(node.tagName==='script'&&attr(node,'type').toLowerCase()==='application/ld+json'){
      try{
        const parsed=JSON.parse((node.childNodes||[]).map(n=>n.value||'').join(''));
        let budget=300;
        const image=(value,depth=0)=>{
          if(depth>5||--budget<0)return;
          if(typeof value==='string')add('structured',value,'structured-data');
          else if(Array.isArray(value))value.forEach(v=>image(v,depth+1));
          else if(value&&typeof value==='object')image(value.contentUrl||value.url,depth+1);
        };
        const walk=(value,depth=0)=>{
          if(depth>8||--budget<0||!value||typeof value!=='object')return;
          if(Array.isArray(value)){value.forEach(v=>walk(v,depth+1));return;}
          const types=[value['@type']].flat().map(t=>String(t).split(/[\/#]/).at(-1));
          if(types.some(t=>t==='Event'||t.endsWith('Event')))image(value.image);
          if(value.mainEntity)walk(value.mainEntity,depth+1);
          if(value['@graph'])walk(value['@graph'],depth+1);
        };
        walk(parsed);
      }catch{/* Malformed optional metadata must not break the calendar. */}
    }
  }
  const seen=new Set();
  return Object.values(groups).flat().filter(image=>{if(seen.has(image.url))return false;seen.add(image.url);return true;}).slice(0,6);
}

export function createPageImageResolver({fetchPage=fetchImagePage, now=Date.now, cacheMap=cache, pending=inflight}={}) {
  return async value=>{
    const url=webUrl(value);
    if(!url)return [];
    const hit=cacheMap.get(url);
    if(hit&&hit.until>now())return hit.images;
    if(pending.has(url))return pending.get(url);
    // Bound concurrent downloads even if the public endpoint receives many requests.
    if(pending.size>=12)return [];
    const work=(async()=>{
      let images=[];
      try{const page=await fetchPage(url);images=extractPageImages(page.html,page.url);}catch{}
      if(cacheMap.size>=200)cacheMap.delete(cacheMap.keys().next().value);
      cacheMap.set(url,{images,until:now()+(images.length?900000:60000)});
      return images;
    })();
    pending.set(url,work);
    try{return await work;}finally{pending.delete(url);}
  };
}
export const resolvePageImages=createPageImageResolver();
