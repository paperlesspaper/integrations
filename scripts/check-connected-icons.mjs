import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

// Inspect generated assets without modifying or re-encoding their pixels.
const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(await readFile(resolve(root, "docs/connected-icon-generation.json"), "utf8"));
const reports = [];
for (const icon of manifest.icons) {
  const config = JSON.parse(await readFile(resolve(root, `applications/${icon.slug}/config.json`), "utf8"));
  const asset = resolve(root, icon.savedPath);
  assert.equal(resolve(root, `applications/${icon.slug}`, config.icon), asset, `${icon.slug}: manifest icon`);
  const bytes = await readFile(asset);
  assert.equal(bytes.subarray(1, 4).toString(), "PNG", `${icon.slug}: PNG signature`);
  const image = await loadImage(asset);
  assert.equal(image.width, image.height, `${icon.slug}: square`);
  assert.ok(image.width >= 1024, `${icon.slug}: resolution`);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
  let transparent = 0, opaque = 0;
  const bounds = [image.width, image.height, -1, -1];
  for (let i = 3; i < pixels.length; i += 4) {
    const alpha = pixels[i];
    if (alpha === 0) transparent++;
    if (alpha >= 250) opaque++;
    if (alpha > 16) {
      const p = (i - 3) / 4;
      const x = p % image.width, y = Math.floor(p / image.width);
      bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y);
      bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y);
    }
  }
  const count = image.width * image.height;
  assert.ok(transparent / count > .1, `${icon.slug}: transparent background`);
  assert.ok(opaque / count > .1, `${icon.slug}: near-opaque artwork`);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (icon.sha256) assert.equal(sha256, icon.sha256, `${icon.slug}: unchanged generated PNG`);
  reports.push({ slug: icon.slug, width: image.width, height: image.height, bytes: bytes.length,
    transparentPercent: Math.round(1000 * transparent / count) / 10,
    nearOpaquePercent: Math.round(1000 * opaque / count) / 10, bounds, sha256 });
}

const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const cards = manifest.icons.map((icon, i) => {
  const src = `../../${icon.savedPath}`;
  const r = reports[i];
  return `<article><h2>${escape(icon.name)}</h2><a class="large checker" href="${src}"><img src="${src}" alt="${escape(icon.name)}" width="192" height="192"></a><div class="samples"><div class="sample light"><img src="${src}" width="48" height="48" alt="48 Pixel auf Weiß"></div><div class="sample dark"><img src="${src}" width="48" height="48" alt="48 Pixel auf Dunkel"></div><div class="sample small light"><img src="${src}" width="32" height="32" alt="32 Pixel auf Weiß"></div></div><p>${r.width} × ${r.height} · PNG mit Transparenz</p><a class="path" href="${src}">${escape(icon.savedPath)}</a></article>`;
}).join("\n");
const html = `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>18 Integrations-Icons · Image Gen</title><style>
*{box-sizing:border-box}body{margin:0;padding:32px;background:#eef2f6;color:#16202d;font:15px/1.5 system-ui,sans-serif}header{max-width:1400px;margin:0 auto 28px}h1{font-size:30px;margin:0 0 4px}header p{margin:0;color:#526174}main{max-width:1400px;margin:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(265px,1fr));gap:20px}article{padding:18px;border:1px solid #dce2ea;border-radius:16px;background:white}h2{font-size:18px;margin:0 0 12px}.large{display:flex;justify-content:center;align-items:center;height:208px;border-radius:8px}.checker{background-color:#fff;background-image:linear-gradient(45deg,#edf0f3 25%,transparent 25%),linear-gradient(-45deg,#edf0f3 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#edf0f3 75%),linear-gradient(-45deg,transparent 75%,#edf0f3 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0px}img{object-fit:contain}.samples{display:flex;gap:10px;margin-top:14px}.sample{display:grid;place-items:center;width:68px;height:68px;border-radius:9px;border:1px solid #d9e0e8}.light{background:#fff}.dark{background:#121820;border-color:#121820}.small{width:52px}p{font-size:12px;color:#526174;margin:12px 0 3px}.path{font-size:11px;color:#385f89;overflow-wrap:anywhere}
</style><header><h1>18 neue Integrations-Icons</h1><p>Mit Image Gen erzeugt · Originale PNGs mit transparentem Hintergrund · Vorschauen in 192, 48 und 32 Pixeln</p></header><main>${cards}</main></html>`;
const output = resolve(root, "output/connected-integrations");
await mkdir(output, { recursive: true });
await writeFile(resolve(output, "icons.html"), html);
await writeFile(resolve(output, "icon-report.json"), JSON.stringify(reports, null, 2) + "\n");
console.log(JSON.stringify({ icons: reports.length, allPassed: true, gallery: resolve(output, "icons.html"), reports }, null, 2));
