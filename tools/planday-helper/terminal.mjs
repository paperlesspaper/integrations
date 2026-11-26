// Browser controls are available only to the local Dokploy terminal over a mode-0600 Unix socket.
import { createServer } from 'node:net';
import { chmod, rm } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { setTimeout as pause } from 'node:timers/promises';
export const socketPath='/tmp/planday-helper-login.sock';
const safe = s => String(s || '').replace(/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g,' ').trim().slice(0,100);

async function controls(worker) {
  const page=worker.page;
  const url=new URL(page.url());
  if (!['https://id.planday.com',worker.config.origin].includes(url.origin)) {
    return {origin:url.origin,items:[],message:'Warte auf das Planday-Portal. Externe SSO- und Passkey-Dialoge benötigen einen eigenen Anmeldeweg.'};
  }
  const options=[];
  if (url.origin===worker.config.origin) return {origin:url.origin,items:[],message:'Der Browser öffnet die konfigurierte Abteilungswoche. Mit Enter prüfen.'};
  const selector='input:not([type=hidden]),button,a,[role=button]';
  for(const el of await page.$$(selector)) {
    const item=await el.evaluate(e=>{
      const r=e.getBoundingClientRect(), style=getComputedStyle(e);
      if(!r.width || !r.height || e.disabled || style.visibility==='hidden')return null;
      const isInput=e.tagName==='INPUT';
      const label=isInput ? (e.labels?.[0]?.innerText || e.getAttribute('aria-label') || e.placeholder || e.name) :
        (e.innerText || e.getAttribute('aria-label') || e.title);
      return {label:label?.trim(),input:isInput,type:e.type,role:e.getAttribute('role')};
    });
    if(!item?.label) {await el.dispose();continue;}
    const loginAction=/^(ok|log ?in|sign ?in|anmelden|einloggen|weiter|continue|next|verify|bestätigen|überprüfen|confirm|send code|code senden|use authenticator app|use another method)$/i;
    const allowed=item.input ? ['email','text','password','tel','number'].includes(item.type) : loginAction.test(item.label);
    if(allowed)options.push({el,input:item.input,label:safe(item.label),origin:url.origin});
    else await el.dispose();
  }
  return {origin:url.origin,items:options};
}

export async function serveTerminal(worker) {
  await rm(socketPath,{force:true});
  const server=createServer(socket=>{
    let mine=false, actions=[], closed=false;
    const send=data=>{if(!socket.destroyed)socket.write(JSON.stringify(data)+'\n');};
    socket.setTimeout(13*60*1000,()=>socket.destroy());
    socket.on('error',()=>{});
    socket.on('close',()=>{closed=true;if(mine)void worker.finishLogin();});
    (async()=>{
      for await(const line of createInterface({input:socket,crlfDelay:Infinity})) {
        if(line.length>8192) throw Error('Eingabe zu lang.');
        const msg=JSON.parse(line);
        if(!mine) {
          if(msg.command!=='begin') throw Error('Anmeldung erforderlich.');
          await worker.startLogin(msg.portal,msg.department);
          mine=true;
          if(closed){await worker.finishLogin();return;}
        } else if(msg.command==='act') {
          const action=actions[msg.index];
          if(!action || new URL(worker.page.url()).origin!==action.origin)throw Error('Die Seite hat sich geändert. Bitte neu öffnen.');
          if(action.input) {
            if(typeof msg.value!=='string' || msg.value.length>2048)throw Error('Ungültiger Wert.');
            await action.el.click({clickCount:3});
            await action.el.press('Backspace');
            await action.el.type(msg.value);
          } else await action.el.click();
        }
        await pause(600);
        if(worker.done){send({done:true});break;}
        if(worker.loginError)throw Error('Zeitfenster beendet oder Seite nicht erreichbar.');
        for(const a of actions)await a.el.dispose().catch(()=>{});
        actions=[];
        try {
          const c=await controls(worker); actions=c.items;
          send({origin:c.origin,message:c.message,items:actions.map(({label,input})=>({label,input}))});
        } catch {send({items:[],message:'Seite lädt. Mit Enter aktualisieren.'});}
      }
    })().catch(()=>send({error:'Anmeldung unterbrochen. Bitte erneut starten.'})).finally(()=>socket.end());
  });
  await new Promise((resolve,reject)=>server.once('error',reject).listen(socketPath,resolve));
  await chmod(socketPath,0o600);
  return server;
}
