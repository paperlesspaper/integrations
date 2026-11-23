import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { JSDOM } from 'jsdom';
import { collectEventImageSources, resolveEventImage, enrichEventImages, webUrl } from '../applications/google-calendar/assets/event-images.js';
import { extractPageImages, createPageImageResolver, publicTarget, fetchImagePage } from '../applications/_shared/event-image-resolver.js';

const document=new JSDOM('').window.document;

test('sources prioritize explicit images, description images and public attachments; skip Google service links',()=>{
  const sources=collectEventImageSources({
    imageUrl:'https://media.example/manual.jpg',
    extendedProperties:{private:{ppImageUrl:'https://media.example/override.png'}},
    description:`<img src="https://media.example/embedded?x=1&amp;y=2"><img src="javascript:bad">
      <a href="https://venue.example/event">Tickets</a>
      <a href="https://media.example/linked.png">Poster</a>
      https://media.example/plain.jpg. https://venue.example/event
      ![cover](https://media.example/markdown)
      https://drive.google.com/file/d/private/view`,
    attachments:[{mimeType:'image/jpeg',fileUrl:'https://media.example/attachment'},{mimeType:'image/png',fileUrl:'https://drive.google.com/file/d/image/view',iconLink:'https://media.example/icon'}],
    source:{url:'https://venue.example/source'}, htmlLink:'https://calendar.google.com/event',
  },{document});
  assert.deepEqual(sources.images.map(i=>i.url),[
    'https://media.example/manual.jpg','https://media.example/override.png','https://media.example/embedded?x=1&y=2',
    'https://media.example/markdown','https://media.example/linked.png','https://media.example/plain.jpg','https://media.example/attachment',
  ]);
  assert.deepEqual(sources.pages,['https://venue.example/event','https://venue.example/source']);
});

test('description-only mode does not inspect event metadata or websites',()=>{
  const sources=collectEventImageSources({imageUrl:'https://a.example/manual.png',description:'https://a.example/page <img src="https://a.example/image">'},{document,automatic:false});
  assert.deepEqual(sources,{images:[{url:'https://a.example/image',source:'description-image'}],pages:[]});
});

test('HTML line breaks preserve plain links and typed attachments upgrade ambiguous links',()=>{
  const sources=collectEventImageSources({description:'<p>https://a.example/one.jpg</p><p>https://a.example/two.png<br>https://a.example/photo</p>',attachments:[{mimeType:'image/jpeg',fileUrl:'https://a.example/photo'}]},{document});
  assert.deepEqual(sources.images.map(i=>i.url),['https://a.example/one.jpg','https://a.example/two.png','https://a.example/photo']);
  assert.deepEqual(sources.pages,[]);
});

test('URL handling rejects credentials and active content and bounds descriptions',()=>{
  for(const value of ['javascript:alert(1)','data:image/png;base64,foo','file:///etc/passwd','https://user:pass@example.org/'])assert.equal(webUrl(value),'');
  const sources=collectEventImageSources({description:Array.from({length:30},(_,i)=>`<img src="https://a.example/${i}.png"> https://b.example/${i}`).join(' ')},{document});
  assert.equal(sources.images.length,12);assert.equal(sources.pages.length,3);
});

test('page metadata handles entities, relative URLs, all supported sources and stable precedence',()=>{
  const result=extractPageImages(`<base href="/events/">
    <meta name="twitter:image" content="../twitter.png">
    <meta content="poster.jpg?a=1&amp;b=2" property="og:image">
    <meta property="og:image:secure_url" content="https://cdn.example/secure.jpg">
    <meta property="og:image" content="javascript:bad">
    <script type="application/ld+json">{"@graph":[{"@type":"Organization","image":"/logo.png"},{"@type":"MusicEvent","image":[{"@type":"ImageObject","contentUrl":"/concert.png"}]}]}</script>
    <meta itemprop="image" content="/micro.png"><img src="/advert.jpg">`, 'https://venue.example/redirected/event');
  assert.deepEqual(result.map(i=>[i.url,i.source]),[
    ['https://venue.example/events/poster.jpg?a=1&b=2','open-graph'],
    ['https://cdn.example/secure.jpg','open-graph'],
    ['https://venue.example/twitter.png','twitter-card'],
    ['https://venue.example/concert.png','structured-data'],
    ['https://venue.example/micro.png','microdata'],
  ]);
});

test('malformed structured data, templates and ordinary page images do not become event artwork',()=>{
  assert.deepEqual(extractPageImages('<script type="application/ld+json">{bad}</script><img src="/logo.png"><template><meta property="og:image" content="/inactive.png"></template>','https://a.example/'),[]);
  const images=extractPageImages('<script type="application/ld+json">{"@type":"WebPage","mainEntity":{"@type":"Event","image":"cover.jpg"}}</script>','https://a.example/new/event');
  assert.equal(images[0].url,'https://a.example/new/cover.jpg');
});

test('broken direct image falls through to metadata candidates; success skips website requests',async()=>{
  const calls=[];
  const loadImage=async url=>{calls.push(url);return url.endsWith('good.jpg');};
  const sources={images:[{url:'https://a.example/broken.jpg',source:'description-image'}],pages:['https://a.example/event']};
  let requests=0;
  const fetchImpl=async(_url,options)=>{
    requests++;assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{urls:sources.pages});
    return Response.json({images:[{url:'https://a.example/also-broken.jpg',source:'open-graph'},{url:'https://a.example/good.jpg',source:'twitter-card'}]});
  };
  assert.equal((await resolveEventImage(sources,{loadImage,fetchImpl})).source,'twitter-card');
  assert.equal(requests,1);assert.equal(calls.length,3);
  await resolveEventImage({images:[{url:'https://a.example/good.jpg',source:'event-image'}],pages:sources.pages},{loadImage,fetchImpl});
  assert.equal(requests,1);
});

test('metadata failures and cancellation leave the calendar renderable',async()=>{
  assert.equal(await resolveEventImage({images:[],pages:['https://a.example/']},{fetchImpl:async()=>{throw Error('offline');}}),null);
  const controller=new AbortController();controller.abort();
  let called=false;
  await enrichEventImages([{imageSources:{images:[],pages:['https://a.example/']}}],{signal:controller.signal,resolve:async()=>{called=true;}});
  assert.equal(called,false);
});

test('page cache deduplicates concurrent work, expires misses and uses the final page URL',async()=>{
  let count=0,time=0;
  const resolve=createPageImageResolver({cacheMap:new Map(),pending:new Map(),now:()=>time,fetchPage:async()=>{
    count++;await new Promise(r=>setTimeout(r,5));return {html:'<meta property="og:image" content="image.jpg">',url:'https://a.example/final/page'};
  }});
  const results=await Promise.all([resolve('https://a.example/start'),resolve('https://a.example/start')]);
  assert.equal(count,1);assert.equal(results[0][0].url,'https://a.example/final/image.jpg');
  await resolve('https://a.example/start');assert.equal(count,1);
  time=900001;await resolve('https://a.example/start');assert.equal(count,2);
  const miss=createPageImageResolver({cacheMap:new Map(),pending:new Map(),now:()=>time,fetchPage:async()=>{count++;throw Error('offline');}});
  await miss('https://b.example/');await miss('https://b.example/');assert.equal(count,3);
  time+=60001;await miss('https://b.example/');assert.equal(count,4);
});

test('public fetch policy rejects private addresses, mixed DNS results, credentials and nonstandard ports',async()=>{
  for(const value of ['http://127.0.0.1/','http://2130706433/','http://[::1]/','http://[::ffff:127.0.0.1]/','http://169.254.169.254/','http://10.0.0.1/','http://localhost/','https://example.org:9000/','https://user:pass@example.org/'])await assert.rejects(publicTarget(value));
  await assert.rejects(publicTarget('https://a.example/',async()=>[{address:'8.8.8.8',family:4},{address:'192.168.1.1',family:4}]));
  const target=await publicTarget('https://a.example/',async()=>[{address:'8.8.8.8',family:4}]);
  assert.equal(target.address.address,'8.8.8.8');
});

test('HTTP transport pins DNS, follows safe redirects, bounds content and rejects private redirects',async()=>{
  const server=createServer((req,res)=>{
    if(req.url==='/redirect'){res.writeHead(302,{location:'/final/page'});res.end();}
    else if(req.url==='/private'){res.writeHead(302,{location:'http://127.0.0.1/secret'});res.end();}
    else if(req.url==='/loop'){res.writeHead(302,{location:'/loop'});res.end();}
    else if(req.url==='/large'){res.writeHead(200,{'Content-Type':'text/html'});res.end('x'.repeat(513*1024));}
    else if(req.url==='/json'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{}');}
    else {res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<meta property="og:image" content="image.png">');}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let requests=0;
  // Route validated test destinations to a fixture server; production has no override.
  const options={lookupImpl:async()=>[{address:'8.8.8.8',family:4}],requestImpl:(url,opts,cb)=>{
    requests++;opts.lookup('a.example',{all:true},(_,addresses)=>assert.deepEqual(addresses,[{address:'8.8.8.8',family:4}]));
    assert.equal(opts.headers.Authorization,undefined);
    return request(`http://127.0.0.1:${server.address().port}${url.pathname}`,{headers:opts.headers},cb);
  }};
  try{
    const page=await fetchImagePage('https://a.example/redirect',options);
    assert.equal(page.url,'https://a.example/final/page');
    const before=requests;await assert.rejects(fetchImagePage('https://a.example/private',options));assert.equal(requests,before+1);
    await assert.rejects(fetchImagePage('https://a.example/loop',options),/redirects/);
    await assert.rejects(fetchImagePage('https://a.example/large',options),/large/);
    await assert.rejects(fetchImagePage('https://a.example/json',options),/HTML/);
    await assert.rejects(fetchImagePage('https://a.example/slow',{timeoutMs:20,lookupImpl:()=>new Promise(()=>{})}),/timeout/);
  }finally{await new Promise(r=>server.close(r));}
});
