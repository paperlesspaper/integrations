import {writeFile,readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const out='output/calendar-design-review';
const variants=[['before-agenda','Vorher · Agenda'],['after-agenda-modern','Nachher · Neue Agenda'],['after-today-next','Nachher · Heute & danach']];
for(const [width,height] of [[800,480],[480,800]]) for(const theme of ['blue-light','dark']) {
  const c=createCanvas(width*3+80,height+110),ctx=c.getContext('2d');
  ctx.fillStyle='#e8e8e8';ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle='#111';ctx.font='bold 22px sans-serif';
  for(const [i,[name,label]] of variants.entries()) {
    ctx.fillText(label,20+i*(width+20),36);
    ctx.drawImage(await loadImage(`${out}/${name}-${theme}-${width}x${height}-epd.png`),20+i*(width+20),55);
  }
  ctx.font='16px sans-serif';ctx.fillText('Identische Beispieltermine · 22. Juli 2026, 12:00 Uhr · Spectra 6, Error Diffusion',20,height+88);
  await writeFile(`${out}/comparison-${theme}-${width}x${height}.png`,c.toBuffer('image/png'));
}
await writeFile(`${out}/index.html`, `<!doctype html>
<html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kalender – Designvergleich</title>
<style>
*{box-sizing:border-box}body{font:16px system-ui;margin:0;padding:32px;background:#ededeb;color:#151515}h1{font-size:32px;margin:0 0 8px}p{line-height:1.5}nav{display:flex;flex-wrap:wrap;gap:20px;margin:24px 0}label{display:grid;gap:7px;font-weight:600}select{font:inherit;padding:8px 12px;border:1px solid #888;background:white;color:black;border-radius:6px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}figure{margin:0}figcaption{font-size:18px;font-weight:700;margin:0 0 12px}img{display:block;width:100%;height:auto;background:white}a{color:inherit}small{display:block;margin:12px 0;color:#444}@media(max-width:900px){.grid{grid-template-columns:1fr}body{padding:20px}}
</style><h1>Kalender: vorher & nachher</h1><p>Gleiche sechs Beispieltermine, gleicher Zeitpunkt: Mittwoch, 22. Juli 2026, 12:00 Uhr.<br>Die neuen Ansichten sind optional. Termine, die nicht vollständig passen, werden über „+ weitere“ gezählt.</p>
<nav><label>Format<select id="size"><option value="800x480">Querformat · 800 × 480</option><option value="480x800">Hochformat · 480 × 800</option></select></label><label>Theme<select id="theme"><option value="blue-light">Hell mit Blau</option><option value="dark">Dunkel</option><option value="blue-dark">Blaue Schrift (blue-dark)</option></select></label><label>Darstellung<select id="mode"><option value="epd">Spectra 6 · Gerätefarben</option><option value="raw">Browser-Original</option></select></label></nav>
<main class="grid">${variants.map(([name,label])=>`<figure><figcaption>${label}</figcaption><a class="full" target="_blank"><img data-name="${name}" alt="${label}"></a><small class="meta"></small></figure>`).join('')}</main>
<p>Die EPD-Bilder sind mit der nativen Spectra-6-Palette und Error Diffusion verarbeitet. Die tatsächliche Panelwirkung hängt von Display und Licht ab.</p>
<script>
const results=${JSON.stringify([...JSON.parse(await readFile(`${out}/before-results.json`,'utf8')),...JSON.parse(await readFile(`${out}/after-results.json`,'utf8'))])};
function update(){const size=document.getElementById('size').value,theme=document.getElementById('theme').value,mode=document.getElementById('mode').value;document.querySelectorAll('figure').forEach(f=>{const img=f.querySelector('img'),name=img.dataset.name+'-'+theme+'-'+size;img.src=name+'-'+mode+'.png';f.querySelector('a').href=img.src;const r=results.find(r=>r.name===name);f.querySelector('.meta').textContent=r?((r.visible??r.titles.length)+' von 6 Terminen sichtbar') : '';});}
document.querySelectorAll('select').forEach(e=>e.addEventListener('change',update));update();
</script></html>`);
console.log(`${out}/index.html`);
