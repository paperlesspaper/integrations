import { createConnection } from 'node:net';
import { createInterface } from 'node:readline/promises';
import { createInterface as lines } from 'node:readline';
import { Writable } from 'node:stream';
import { socketPath } from './terminal.mjs';

if(!process.stdin.isTTY)throw Error('Bitte ein interaktives Dokploy-Terminal öffnen.');
let hide=false;
const output=new Writable({write(chunk,enc,cb){if(!hide)process.stdout.write(chunk);cb();}});
const tty=createInterface({input:process.stdin,output,terminal:true,historySize:0});
const socket=createConnection(socketPath);
socket.on('error',()=>console.error('Helper-Terminal nicht erreichbar.'));
const send=o=>socket.write(JSON.stringify(o)+'\n');
send({command:'begin',portal:process.argv[2],department:process.argv[3]});
console.log('Planday-Anmeldung. Zahl wählen, Enter aktualisiert die Ansicht, q beendet. Alle Feldwerte werden verdeckt eingegeben.');
try{
  for await(const line of lines({input:socket,crlfDelay:Infinity})){
    const state=JSON.parse(line);
    if(state.done){console.log('Wochenplan synchronisiert. Der automatische Abruf ist aktiv.');break;}
    if(state.error){console.log(state.error);break;}
    console.log('\n'+(state.origin || ''),state.message || '');
    state.items.forEach((a,i)=>console.log((i+1)+'. '+a.label+(a.input?' (eingeben)':'')));
    const cmd=(await tty.question('Auswahl: ')).trim();
    if(cmd==='q')break;
    const index=Number(cmd)-1;
    const a=state.items[index];
    if(!cmd || !a){send({command:'refresh'});continue;}
    let value;
    if(a.input){
      process.stdout.write(a.label+' (verdeckt): ');hide=true;
      try{value=await tty.question('');}finally{hide=false;process.stdout.write('\n');}
    }
    send({command:'act',index,value});
  }
}finally{tty.close();socket.destroy();}
