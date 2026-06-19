# paperlesspaper Integrations

This repository contains a Docker-ready collection of paperlesspaper Open Integrations. Each integration is a small HTML/CSS/JS provider that exposes a manifest, a render page, and optionally a settings page or server-side data route.

The structure is based on the official [paperlesspaper Open Integration overview](https://docs.paperlesspaper.de/open-integration/overview). That documentation defines the core contract this repo follows: a public `config.json`, a deterministic `render.html` surface for screenshot generation, optional `settings.html`, and loading markers that let paperlesspaper wait until async content is ready.

## Quick Start

Install dependencies and start the local provider:

```sh
npm install
npm start
```

The server listens on `http://localhost:3000` by default. Check the health endpoint with:

```sh
curl http://localhost:3000/health
```

## How It Works

Integrations live in `applications/<slug>/`.

| File | Purpose |
| --- | --- |
| `config.json` | Install manifest consumed by paperlesspaper. |
| `render.html` | Full-screen display surface captured for the ePaper image. |
| `settings.html` | Optional custom settings UI embedded by paperlesspaper. |
| `api/data.js` | Optional server-side data loader exposed at `/<slug>/api/data`. |
| `languages/*.json` | Localized labels and descriptions. |
| `assets/*` | Integration-specific icons and static assets. |

The Express server maps every application folder to predictable URLs:

```txt
/:slug/             -> applications/:slug/render.html
/:slug/render.html  -> applications/:slug/render.html
/:slug/config.json  -> applications/:slug/config.json
/:slug/api/data     -> applications/:slug/api/data.js
/assets/*           -> shared helper assets
```

Render pages use shared assets from `@paperlesspaper/openintegration`, copied into `public/` during `npm install` and Docker builds.

## Available Integrations

Install an integration in paperlesspaper with its manifest URL:

```txt
https://your-domain.example/<slug>/config.json
```

For local development, use `http://localhost:3000/<slug>/config.json`.

| Slug | Name | Description |
| --- | --- | --- |
| `apple-photos-gallery` | Apple Photos Gallery | Shows a random or numbered image from a public Apple Photos shared album. |
| `astronauts` | Astronauts | Shows the current people in space, grouped by spacecraft or station. |
| `day-calendar` | Day Calendar | Shows the current day with optional demotivational quotes or funny facts. |
| `deutsche-bahn-abfahrten` | Deutsche Bahn Abfahrten | Shows upcoming realtime departures for a Deutsche Bahn station. |
| `duden-wort-des-tages` | Duden Wort des Tages | Shows Duden's German word of the day with meaning, usage, origin, type, and frequency. |
| `formula-1-races` | Formula 1 Races | Shows the upcoming Formula 1 Grand Prix with circuit details and session times. |
| `immich-photos` | Immich Photos | Shows a random, newest, or oldest photo from an Immich server. |
| `mastodon` | Mastodon | Shows a Mastodon home timeline, hashtag stream, or profile feed. |
| `newsstand` | Newsstand | Shows a fresh newspaper front page from Riley Walz's Papers archive. |
| `opening-hours` | Opening Hours | Shows current opening status, today's hours, and the weekly schedule for a place. |
| `quote` | Quote | Shows a deterministic daily quote. |
| `simple-calendar` | Simple Calendar | Shows a configurable monthly calendar inspired by the TRMNL Simple Calendar recipe. |
| `the-onion-editorial-cartoon` | The Onion - Editorial Cartoon | Shows a recent editorial cartoon from The Onion's Cartoons section. |
| `uptime-kuma-monitor` | Uptime Kuma Monitor | Shows a public Uptime Kuma status page with uptime, incidents, and maintenance. |
| `weather` | Weather | Shows current weather and a three-day forecast from Open-Meteo. |
| `world-cup-2026` | World Cup 2026 | Shows World Cup 2026 results, fixtures, and the group table for a favorite team. |
| `xkcd` | XKCD | Shows the latest, random, or offset XKCD comic. |

## Development

Use the render URL while building an integration:

```txt
http://localhost:3000/<slug>/
```

Use the manifest URL when installing it in paperlesspaper:

```txt
http://localhost:3000/<slug>/config.json
```

Open Integrations should render within `100vw` by `100vh`, avoid browser-only chrome, and keep layout stable for predictable screenshots. If an integration fetches data, create the loading marker immediately and only mark the page loaded once content is ready:

```html
<div id="website-has-loading-element"></div>
<div id="website-has-loaded">ready</div>
```

## Screenshots

Regenerate local variant screenshots and update `configVariants` in application manifests:

```sh
npm run screenshots
```

Useful filters while iterating:

```sh
npm run screenshots -- --config-only
npm run screenshots -- --app weather --resolution 800x480
```

Generated screenshots are ignored by git under `output/` and `applications/*/screenshots/`.

## Docker

Build and run the container directly:

```sh
npm run docker:build
npm run docker:run
```

Or use Docker Compose:

```sh
docker compose up --build
```

## Hosting

When hosting this provider for real devices, expose it over HTTPS and make sure paperlesspaper can fetch each integration manifest from the browser. The public install URL should look like:

```txt
https://your-domain.example/<slug>/config.json
```

Some integrations call upstream APIs from `api/data.js`. Keep credentials in environment variables or user-provided settings, not in committed files. `.env`, `node_modules`, generated output, and local workspace files are intentionally ignored.

## Adding An Integration

1. Create `applications/<slug>/`.
2. Add a `config.json` manifest with `name`, `version`, `description`, `renderPage`, and any settings schema.
3. Add `render.html` and make it deterministic at the target viewport size.
4. Add `settings.html` only when the built-in schema fields are not enough.
5. Add `api/data.js` only when data should be fetched server-side.
6. Run `npm run screenshots -- --app <slug>` to refresh variants.

Use the smallest provider that works: plain manifest settings first, a custom settings page when the user experience needs it, and server routes only when browser-side rendering cannot call the upstream service directly.
