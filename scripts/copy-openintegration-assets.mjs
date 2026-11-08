import { copyFile, mkdir, readdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const sourceDir = path.join(process.cwd(), 'node_modules/@paperlesspaper/openintegration/dist');
const openSansDir = path.join(process.cwd(), 'node_modules/@fontsource/open-sans');
const publicDir = path.join(process.cwd(), 'public');
const applicationsDir = path.join(process.cwd(), 'applications');
const openSansWeights = [300, 400, 500, 600, 700, 800];
const openSansStyles = ['normal', 'italic'];

const assets = [
  ['paperless.css', 'paperless.css'],
  ['paperless.iife.js', 'paperless.iife.js'],
  ['settings.css', 'settings.css'],
  ['preview.css', 'runner.css'],
];

await mkdir(publicDir, { recursive: true });

for (const [sourceName, targetName] of assets) {
  const source = path.join(sourceDir, sourceName);
  const target = path.join(publicDir, targetName);

  await copyFile(source, target);
  console.log(`copied ${sourceName} -> ${path.relative(process.cwd(), target)}`);
}

const publicFontsDir = path.join(publicDir, 'fonts');
await mkdir(publicFontsDir, { recursive: true });

for (const weight of openSansWeights) {
  for (const style of openSansStyles) {
    const fileName = `open-sans-latin-${weight}-${style}.woff2`;
    await copyFile(
      path.join(openSansDir, 'files', fileName),
      path.join(publicFontsDir, fileName),
    );
  }
}

await copyFile(
  path.join(openSansDir, 'LICENSE'),
  path.join(publicFontsDir, 'open-sans-LICENSE.txt'),
);
console.log('copied Open Sans from @fontsource/open-sans -> public/fonts');

async function run(command, args, cwd) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed in ${path.relative(process.cwd(), cwd)} with ${code}`));
    });
  });
}

let applicationEntries = [];
try {
  applicationEntries = await readdir(applicationsDir, { withFileTypes: true });
} catch (error) {
  if (error?.code !== 'ENOENT') {
    throw error;
  }
}

for (const entry of applicationEntries) {
  if (!entry.isDirectory()) {
    continue;
  }

  const applicationDir = path.join(applicationsDir, entry.name);
  const packagePath = path.join(applicationDir, 'package.json');
  let packageJson;

  try {
    packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      continue;
    }
    throw error;
  }

  if (packageJson?.paperlesspaperIntegration !== true) {
    continue;
  }

  console.log(`installing integration dependencies -> ${path.relative(process.cwd(), applicationDir)}`);
  await run('npm', ['install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], applicationDir);
  await run('npm', ['run', 'copy:assets', '--if-present'], applicationDir);
}
