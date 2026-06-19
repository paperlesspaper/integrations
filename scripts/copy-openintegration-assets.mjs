import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const sourceDir = path.join(process.cwd(), 'node_modules/@paperlesspaper/openintegration/dist');
const publicDir = path.join(process.cwd(), 'public');

const assets = [
  ['paperless.css', 'paperless.css'],
  ['paperless.iife.js', 'paperless.iife.js'],
  ['preview.css', 'runner.css'],
];

await mkdir(publicDir, { recursive: true });

for (const [sourceName, targetName] of assets) {
  const source = path.join(sourceDir, sourceName);
  const target = path.join(publicDir, targetName);

  await copyFile(source, target);
  console.log(`copied ${sourceName} -> ${path.relative(process.cwd(), target)}`);
}
