import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const packageDir = path.join(rootDir, "node_modules", "@paperlesspaper", "virtualsky");
const targetDir = path.join(rootDir, "assets", "virtualsky");

const files = [
  "README.md",
  "boundaries.json",
  "galaxy.json",
  "lines_latin.json",
  "stars.json",
  "stuquery.min.js",
  "virtualsky-planets.js",
  "virtualsky.min.js",
  "lang/de.json",
  "lang/en.json"
];

await rm(targetDir, { force: true, recursive: true });
await mkdir(targetDir, { recursive: true });

for (const file of files) {
  const source = path.join(packageDir, file);
  const target = path.join(targetDir, file);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
  console.log(`copied ${path.relative(rootDir, source)} -> ${path.relative(rootDir, target)}`);
}
