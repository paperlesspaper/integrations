import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import nextcloud from '../applications/nextcloud-calendar/api/data.js';
import { resolveGoogleEventColors } from '../applications/google-calendar/calendar-colors.js';
import outlook from '../applications/outlook-calendar/api/data.js';
import caldav from '../applications/caldav/api/data.js';

const ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nX-APPLE-CALENDAR-COLOR:#ff0000ff\r\nBEGIN:VEVENT\r\nUID:color-test\r\nDTSTART:20260722T100000Z\r\nDTEND:20260722T110000Z\r\nSUMMARY:Meeting\r\nEND:VEVENT\r\nEND:VCALENDAR';

test('Google resolves event overrides and calendar metadata without using the global theme', () => {
  const payload = { meta: { color: 'green-light', calendarData: {
    colors: { event: { 11: { background: '#ff0000' } }, calendar: { 9: { background: '#0000ff' } } },
    calendars: [{ id: 'work', colorId: '9' }, { id: 'personal', backgroundColor: '#00ff00' }]
  } } };
  assert.deepEqual(resolveGoogleEventColors({ calendarId: 'work', colorId: '11' }, payload), {color:'#ff0000',calendarColor:'#0000ff'});
  assert.deepEqual(resolveGoogleEventColors({ calendarId: 'personal' }, payload), {color:'',calendarColor:'#00ff00'});
  assert.deepEqual(resolveGoogleEventColors({}, {color:'red-light'}), {color:'',calendarColor:''});
  assert.equal(resolveGoogleEventColors({color:'#ffff00',colorId:'11'},payload).color,'#ffff00');
  assert.equal(resolveGoogleEventColors({calendarId:'other'},{calendarData:{calendar:{id:'work'},calendarColor:'#f00'}}).calendarColor,'');
});

test('Outlook reads calendar appearance and tolerates missing metadata', async () => {
  const original = globalThis.fetch;
  const query = { tenantId:'tenant', clientId:'client', clientSecret:'secret',userId:'user@example.com',
    calendarId:'work',rangeStart:'2026-07-20',rangeEndExclusive:'2026-07-27',timeZone:'UTC' };
  try {
    for (const available of [true,false]) {
      const urls=[];
      globalThis.fetch=async (url) => {
        urls.push(String(url));
        if (String(url).includes('/token')) return Response.json({access_token:'test-token'});
        if (String(url).includes('/calendarView')) return Response.json({value:[{id:'event',subject:'Meeting',start:{dateTime:'2026-07-22T10:00:00',timeZone:'UTC'},end:{dateTime:'2026-07-22T11:00:00',timeZone:'UTC'}}]});
        return available ? Response.json({hexColor:'#1234ff'}) : new Response('Unsupported',{status:403});
      };
      const result=await outlook({query});
      assert.equal(result.events.length,1);
      assert.equal(result.calendarColor,available?'#1234ff':'');
      assert.ok(urls.some(url=>url.includes('/calendars/work?')));
    }
  } finally {globalThis.fetch=original;}
});

test('CalDAV reads collection colors without requiring optional PROPFIND support', async () => {
  const keys=['PAPERLESSPAPER_ALLOW_PRIVATE_CALENDAR_NETWORKS','PAPERLESSPAPER_ALLOW_INSECURE_CALENDAR_HTTP'];
  const previous=keys.map(k=>process.env[k]);
  keys.forEach(k=>{process.env[k]='true';});
  let available=true;
  const server=createServer((req,res)=>{
    if(req.method==='PROPFIND') {
      res.writeHead(available?207:405);
      res.end(available?'<d:multistatus xmlns:d="DAV:"><d:response><d:propstat><d:prop><a:calendar-color xmlns:a="http://apple.com/ns/ical/">#0000ffff</a:calendar-color></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response></d:multistatus>':'');
    } else {
      res.writeHead(207);
      res.end(`<d:multistatus xmlns:d="DAV:"><c:calendar-data xmlns:c="urn:ietf:params:xml:ns:caldav"><![CDATA[${ics}]]></c:calendar-data></d:multistatus>`);
    }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    for(const supported of [true,false]) {
      available=supported;
      const result=await caldav({query:{calendarUrl:`http://127.0.0.1:${server.address().port}/work/`,username:'test',password:'test',allowHttp:true,rangeStart:'2026-07-20',rangeEndExclusive:'2026-07-27',timeZone:'UTC'}});
      assert.equal(result.events.length,1);
      assert.equal(result.events[0].calendarColor,'#ff0000ff');
      assert.equal(result.calendarColor,available?'#0000ffff':'');
    }
  } finally {
    await new Promise(resolve=>server.close(resolve));
    keys.forEach((k,i)=>{if(previous[i]===undefined)delete process.env[k];else process.env[k]=previous[i];});
  }
});

test('Nextcloud preserves event colors and discovers the calendar color', async () => {
  const original=globalThis.fetch;
  const prop=(content,href='/remote.php/dav/calendars/test/work/')=>`<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:a="http://apple.com/ns/ical/"><d:response><d:href>${href}</d:href><d:propstat><d:prop>${content}</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response></d:multistatus>`;
  try {
    globalThis.fetch=async (url,options)=>{
      const body=options.body;
      let xml;
      if(body.includes('current-user-principal'))xml=prop('<d:current-user-principal><d:href>/remote.php/dav/principals/users/test/</d:href></d:current-user-principal>');
      else if(body.includes('calendar-home-set'))xml=prop('<c:calendar-home-set><d:href>/remote.php/dav/calendars/test/</d:href></c:calendar-home-set>');
      else if(options.method==='PROPFIND') {
        assert.ok(body.includes('calendar-color'));
        xml=prop('<d:displayname>Work</d:displayname><d:resourcetype><c:calendar/></d:resourcetype><a:calendar-color>#00ff00ff</a:calendar-color>');
      } else xml=prop(`<c:calendar-data><![CDATA[${ics.replace('SUMMARY:Meeting','COLOR:blue\r\nSUMMARY:Meeting')}]]></c:calendar-data>`);
      return new Response(xml,{status:207});
    };
    const result=await nextcloud({query:{serverUrl:'https://cloud.example.com',username:'test',appPassword:'test',calendarName:'Work',rangeStart:'2026-07-20',rangeEndExclusive:'2026-07-27',timeZone:'UTC'}});
    assert.equal(result.calendarColor,'#00ff00ff');
    assert.equal(result.events[0].color,'blue');
    assert.equal(result.events[0].calendarColor,'#ff0000ff');
  } finally {globalThis.fetch=original;}
});
