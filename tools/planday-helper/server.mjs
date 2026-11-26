import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { WeekBrowser } from './capture.mjs';
import { serveTerminal } from './terminal.mjs';
import { directory, settings } from './settings.mjs';
import { currentWeek } from './week.mjs';

const keyFile = directory + '/frame-key';
try { await writeFile(keyFile, randomBytes(32).toString('base64url'), {flag:'wx',mode:0o600}); }
catch (e) { if (e.code !== 'EEXIST') throw e; }
const key = Buffer.from('Bearer ' + (await readFile(keyFile,'utf8')).trim());
const worker = new WeekBrowser();
await serveTerminal(worker);
const server = createServer(async (req,res) => {
  res.setHeader('Cache-Control','no-store');
  if (req.method === 'GET' && req.url === '/health') {res.writeHead(200).end('ok');return;}
  if (req.method !== 'GET' || req.url !== '/week') {res.writeHead(404).end();return;}
  const supplied = Buffer.from(req.headers.authorization || '');
  if (supplied.length !== key.length || !timingSafeEqual(supplied,key)) {res.writeHead(401).end();return;}
  try {
    const week = JSON.parse(await readFile(directory+'/week.json','utf8'));
    const {origin,department} = await settings();
    if (week.origin !== origin || week.department !== department || week.from !== currentWeek().from ||
        Date.now()-Date.parse(week.updated)>30*60000) throw Error('stale');
    res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify(week));
  } catch {res.writeHead(503).end();}
});
server.listen(3100);
void worker.refresh();
setInterval(() => void worker.refresh(),10*60000);
process.once('SIGTERM',async()=>{await worker.browser?.close();process.exit(0);});
