import test from 'node:test';
import assert from 'node:assert/strict';
import { loadParcels, normalizeDelivery } from '../applications/parcel/api/data.js';
import { loadReadwise, selectHighlight } from '../applications/readwise/api/data.js';
import { loadMovies, normalizeMovie } from '../applications/upcoming-movies/api/data.js';
const noNetwork = () => assert.fail('Unexpected network request');

test('Parcel uses read-only fixed endpoint, header auth and cache within provider limits', async () => {
  const data = await loadParcels({ apiKey: 'secret', filterMode: 'recent' }, async (url, opts) => {
    assert.equal(url, 'https://api.parcel.app/external/deliveries/?filter_mode=recent');
    assert.equal(opts.headers['api-key'], 'secret'); assert.ok(opts.ttl >= 180000);
    return { success: true, deliveries: [{ description: 'Delivered', status_code: 0 }, { description: 'Pickup', status_code: 3 }] };
  });
  assert.equal(data.total, 2); assert.equal(data.deliveries[0].status, 3);
});
test('Parcel status zero, unknown codes, timezone-less strings and seconds timestamps stay distinct', () => {
  assert.equal(normalizeDelivery({ status_code: 0 }).status, 0);
  assert.equal(normalizeDelivery({ status_code: null }).status, -1);
  assert.equal(normalizeDelivery({ status_code: 42 }).status, -1);
  const d = normalizeDelivery({ date_expected: 'Tomorrow afternoon', timestamp_expected: null, events: [{event:'Ready',date:'Today'}] });
  assert.equal(d.expected, ''); assert.equal(d.expectedLabel, 'Tomorrow afternoon'); assert.equal(d.event, 'Ready');
  assert.equal(normalizeDelivery({timestamp_expected: 1704067200}).expected, '2024-01-01T00:00:00.000Z');
});
test('Parcel active filtering, priority, limits, and hidden tracking numbers', async () => {
  const response = { success: true, deliveries: [0, 2, 7, 3, 4].map(status_code => ({ status_code, tracking_number:'private', extra_information:'private postcode' })) };
  const d = await loadParcels({ apiKey:'a', limit:2 }, async () => response);
  assert.equal(d.total, 4); assert.deepEqual(d.deliveries.map(x => x.status), [7,3]);
  assert.ok(!JSON.stringify(d).includes('private'));
  const shown = await loadParcels({ apiKey:'a', showTrackingNumber:true }, async () => response);
  assert.equal(shown.deliveries[0].trackingNumber, 'private');
});
test('Parcel missing credentials and errors never produce demonstration deliveries', async () => {
  await assert.rejects(loadParcels({}, noNetwork), /required/);
  await assert.rejects(loadParcels({apiKey:'a'}, async () => ({success:false,error_message:'secret echoed'})), /API access/);
  await assert.rejects(loadParcels({apiKey:'a'}, async () => {throw new Error('HTTP 401');}), /401/);
  assert.equal((await loadParcels({sampleData:true},noNetwork)).sample,true);
});
test('Readwise calls only review endpoint with token header, excludes discarded highlights', async () => {
  const d = await loadReadwise({apiToken:'secret', rotation:'fixed'}, async (url, opts) => {
    assert.equal(url,'https://readwise.io/api/v2/review/'); assert.equal(opts.headers.Authorization,'Token secret');
    return {highlights:[{text:'Discard',is_discard:true},{text:'Keep',title:'Book',author:'Author',note:'Note'}]};
  });
  assert.equal(d.total,1); assert.equal(d.highlight.text,'Keep'); assert.equal(d.highlight.title,'Book');
});
test('Readwise rotates at local day boundaries and fixed selection is stable', () => {
  const h = Array.from({length:5},(_,i)=>i);
  const before=selectHighlight(h,{timeZone:'Europe/Berlin'},new Date('2026-09-27T21:59:00Z'));
  const after=selectHighlight(h,{timeZone:'Europe/Berlin'},new Date('2026-09-27T22:01:00Z'));
  assert.equal(after.index,(before.index+1)%5);
  assert.equal(selectHighlight(h,{rotation:'fixed',highlightIndex:7}).index,2);
  assert.equal(selectHighlight([],{}).highlight,null);
  assert.throws(()=>selectHighlight(h,{timeZone:'invalid'}),RangeError);
});
test('Readwise hourly rotation, no notes, and empty review', async () => {
  const h=[0,1,2,3,4];
  const a=selectHighlight(h,{rotation:'hourly'},new Date('2026-09-27T10:00:00Z'));
  const b=selectHighlight(h,{rotation:'hourly'},new Date('2026-09-27T11:00:00Z'));
  assert.equal(b.index,(a.index+1)%5);
  const d=await loadReadwise({sampleData:true,showNote:false},noNetwork);
  assert.equal(d.highlight.note,'');
  const empty=await loadReadwise({apiToken:'x'},async()=>{throw Error('Source returned HTTP 404');});
  assert.equal(empty.total,0);assert.equal(empty.sample,false);
  await assert.rejects(loadReadwise({apiToken:'x'},async()=>{throw Error('Source returned HTTP 401');}),/401/);
  await assert.rejects(loadReadwise({},noNetwork),/required/);
  await assert.rejects(loadReadwise({apiToken:'x'},async()=>({})),/Invalid/);
});
test('Movies preserve TMDB endpoint/count and use HTTPS, host language and region', async () => {
  const d=await loadMovies({apiKey:'test-key',language:'de-DE',region:'at',count:2},async(url,opts)=>{
    const u=new URL(url);assert.equal(u.origin,'https://api.themoviedb.org');assert.equal(u.pathname,'/3/movie/upcoming');
    assert.equal(u.searchParams.get('api_key'),'test-key');assert.equal(u.searchParams.get('language'),'de-DE');assert.equal(u.searchParams.get('region'),'AT');
    assert.ok(opts.ttl>=3600000);
    return {results:[1,2,3].map(id=>({id,title:`Film ${id}`,release_date:'2026-10-01',poster_path:'/abc.jpg'}))};
  });
  assert.equal(d.movies.length,2);assert.equal(d.movies[0].poster,'https://image.tmdb.org/t/p/w500/abc.jpg');assert.equal(d.region,'AT');
});
test('Movies retain server TMDB_API_KEY fallback with per-display override', async () => {
  const previous=process.env.TMDB_API_KEY;
  try {
    process.env.TMDB_API_KEY='server-key';
    await loadMovies({},async url=>{assert.equal(new URL(url).searchParams.get('api_key'),'server-key');return {results:[]};});
    await loadMovies({apiKey:'display-key'},async url=>{assert.equal(new URL(url).searchParams.get('api_key'),'display-key');return {results:[]};});
    delete process.env.TMDB_API_KEY; await assert.rejects(loadMovies({},noNetwork),/required/);
  } finally {if(previous===undefined)delete process.env.TMDB_API_KEY;else process.env.TMDB_API_KEY=previous;}
});
test('Movies reject malformed data, unsafe posters and invalid country; demos are fully local', async()=>{
  assert.equal(normalizeMovie({poster_path:'//evil.example/x.jpg'}).poster,'');
  assert.equal(normalizeMovie({poster_path:'/../x.jpg'}).poster,'');
  assert.equal(normalizeMovie({release_date:'invalid'}).releaseDate,'');
  assert.equal(normalizeMovie({release_date:'2026-02-31'}).releaseDate,'');
  await assert.rejects(loadMovies({region:'Germany'},noNetwork),/two-letter/);
  await assert.rejects(loadMovies({apiKey:'x'},async()=>({error:'no'})),/Invalid/);
  const d=await loadMovies({sampleData:true,count:100,language:'en'},noNetwork);
  assert.equal(d.movies.length,6);assert.ok(d.movies.every(m=>m.poster.startsWith('./assets/')));
  assert.equal(d.movies[0].title,'The Last Orbit');
});
