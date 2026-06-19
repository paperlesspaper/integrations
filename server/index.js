import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRunPage } from './runPage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const applicationsDir = path.join(rootDir, 'applications');
const publicDir = path.join(rootDir, 'public');

async function loadEnv(filePath) {
  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

await loadEnv(path.join(rootDir, '.env'));

const port = Number(process.env.PORT || 3000);

const app = express();
const corsAllowedMethods = 'GET,HEAD,OPTIONS';
const allowedApiNamePattern = /^[a-z0-9-]+$/;
const allowedAssetExtensions = new Set(['.jpg', '.jpeg', '.png', '.svg', '.webp']);
const allowedLanguageExtensions = new Set(['.json']);

function isSafeSlug(slug) {
  return /^[a-z0-9-]+$/.test(slug);
}

function isSafeFileName(fileName, allowedExtensions) {
  return (
    /^[a-z0-9][a-z0-9._-]*$/i.test(fileName) &&
    allowedExtensions.has(path.extname(fileName).toLowerCase())
  );
}

async function getIntegrationSlugs() {
  const entries = await fs.readdir(applicationsDir, { withFileTypes: true });
  return new Set(
    entries
      .filter((entry) => entry.isDirectory() && isSafeSlug(entry.name))
      .map((entry) => entry.name),
  );
}

let integrationSlugs = await getIntegrationSlugs();

function integrationPath(slug, ...parts) {
  const target = path.resolve(applicationsDir, slug, ...parts);
  const base = path.resolve(applicationsDir, slug);
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) {
    return null;
  }
  return target;
}

async function hasIntegration(slug) {
  if (!isSafeSlug(slug)) {
    return false;
  }
  if (!integrationSlugs.has(slug)) {
    integrationSlugs = await getIntegrationSlugs();
  }
  return integrationSlugs.has(slug);
}

async function sendIntegrationFile(response, slug, fileName) {
  if (!(await hasIntegration(slug))) {
    response.status(404).json({ error: 'Unknown integration' });
    return;
  }

  const filePath = integrationPath(slug, fileName);
  if (!filePath) {
    response.status(400).json({ error: 'Invalid path' });
    return;
  }

  response.set('Cache-Control', 'no-cache');
  response.sendFile(filePath);
}

async function readIntegrationConfig(slug) {
  const filePath = integrationPath(slug, 'config.json');
  if (!filePath) {
    return null;
  }

  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function sendIntegrationApi(request, response, slug, apiName) {
  if (!allowedApiNamePattern.test(apiName)) {
    response.status(400).json({ error: 'Invalid API name' });
    return;
  }

  if (!(await hasIntegration(slug))) {
    response.status(404).json({ error: 'Unknown integration' });
    return;
  }

  const apiPath = integrationPath(slug, 'api', `${apiName}.js`);
  if (!apiPath) {
    response.status(400).json({ error: 'Invalid path' });
    return;
  }

  try {
    await fs.access(apiPath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      response.status(404).json({ error: 'Unknown API' });
      return;
    }

    throw error;
  }

  try {
    response.set('Cache-Control', 'no-store');
    const moduleUrl = `${pathToFileURL(apiPath).href}?updated=${Date.now()}`;
    const module = await import(moduleUrl);

    if (typeof module.default !== 'function') {
      response.status(500).json({ error: 'API handler missing default export' });
      return;
    }

    const data = await module.default({
      query: request.query,
      request,
    });

    response.json(data);
  } catch (error) {
    console.error(error);
    response.status(500).json({
      error: error instanceof Error ? error.message : 'API request failed',
    });
  }
}

function integrationWebPath(slug, filePath) {
  return `/${slug}/${filePath.replace(/^\.?\//, '')}`;
}

app.disable('x-powered-by');

app.use((request, response, next) => {
  const requestedHeaders = request.get('Access-Control-Request-Headers');

  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', corsAllowedMethods);
  response.set('Access-Control-Allow-Headers', requestedHeaders || '*');
  response.set('Access-Control-Max-Age', '86400');

  if (requestedHeaders) {
    response.vary('Access-Control-Request-Headers');
  }

  if (request.method === 'OPTIONS') {
    response.sendStatus(204);
    return;
  }

  next();
});

app.use(
  '/assets',
  express.static(publicDir, {
    immutable: false,
    maxAge: '1d',
  }),
);

app.get('/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/:slug/', async (request, response) => {
  await sendIntegrationFile(response, request.params.slug, 'render.html');
});

app.get('/:slug/render.html', async (request, response) => {
  await sendIntegrationFile(response, request.params.slug, 'render.html');
});

app.get('/:slug/config.json', async (request, response) => {
  await sendIntegrationFile(response, request.params.slug, 'config.json');
});

app.get('/:slug/run', async (request, response) => {
  const { slug } = request.params;
  if (!(await hasIntegration(slug))) {
    response.status(404).json({ error: 'Unknown integration' });
    return;
  }

  try {
    const config = await readIntegrationConfig(slug);
    response.set('Cache-Control', 'no-cache');
    response.type('html').send(
      createRunPage({
        config,
        renderPath: integrationWebPath(slug, config.renderPage || './render.html'),
        settingsPath: config.settingsPage ? integrationWebPath(slug, config.settingsPage) : '',
        slug,
      }),
    );
  } catch (error) {
    console.error(error);
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Runner failed',
    });
  }
});

app.get('/:slug/settings.html', async (request, response) => {
  await sendIntegrationFile(response, request.params.slug, 'settings.html');
});

app.get('/:slug/languages/:fileName', async (request, response) => {
  const { fileName, slug } = request.params;
  if (!isSafeFileName(fileName, allowedLanguageExtensions)) {
    response.status(400).json({ error: 'Invalid language file' });
    return;
  }

  await sendIntegrationFile(response, slug, path.join('languages', fileName));
});

app.get('/:slug/assets/:fileName', async (request, response) => {
  const { fileName, slug } = request.params;
  if (!isSafeFileName(fileName, allowedAssetExtensions)) {
    response.status(400).json({ error: 'Invalid asset file' });
    return;
  }

  await sendIntegrationFile(response, slug, path.join('assets', fileName));
});

app.get('/:slug/api/:apiName', async (request, response) => {
  await sendIntegrationApi(request, response, request.params.slug, request.params.apiName);
});

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`paperlesspaper OpenIntegrations listening on :${port}`);
});
