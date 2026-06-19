# paperlesspaper OpenIntegrations

A Docker-releasable bundle of plain HTML/CSS/JS paperlesspaper OpenIntegrations using shared helper assets from `@paperlesspaper/openintegration`.

## Install

```sh
npm install
```

## Run locally

```sh
npm start
```

## Screenshots

Regenerate the checked-in variant screenshots and update `configVariants` in every application config:

```sh
npm run screenshots
```

The script calls the `paperlesspaper-openintegration render` CLI and writes the default EPD-optimized PNG output. Use `-- --config-only` to update `config.json` files without rendering, or filters such as `-- --app weather --resolution 800x480` while iterating.

## Docker

```sh
docker build -t paperlesspaper-openintegrations:latest .
docker run --rm -p 3000:3000 paperlesspaper-openintegrations:latest
```

## Docker Compose

```sh
docker compose up --build
```

## URLs

- http://localhost:3000/xkcd/
- http://localhost:3000/weather/
- http://localhost:3000/quote/
- http://localhost:3000/apple-photos-gallery/
- http://localhost:3000/astronauts/
- http://localhost:3000/day-calendar/
- http://localhost:3000/the-onion-editorial-cartoon/
- http://localhost:3000/duden-wort-des-tages/
- http://localhost:3000/simple-calendar/
- http://localhost:3000/formula-1-races/
- http://localhost:3000/opening-hours/
- http://localhost:3000/uptime-kuma-monitor/

## Config URLs

- http://localhost:3000/xkcd/config.json
- http://localhost:3000/weather/config.json
- http://localhost:3000/quote/config.json
- http://localhost:3000/apple-photos-gallery/config.json
- http://localhost:3000/astronauts/config.json
- http://localhost:3000/day-calendar/config.json
- http://localhost:3000/the-onion-editorial-cartoon/config.json
- http://localhost:3000/duden-wort-des-tages/config.json
- http://localhost:3000/simple-calendar/config.json
- http://localhost:3000/formula-1-races/config.json
- http://localhost:3000/opening-hours/config.json
- http://localhost:3000/uptime-kuma-monitor/config.json

## API URLs

- http://localhost:3000/xkcd/api/data
- http://localhost:3000/weather/api/data
- http://localhost:3000/quote/api/data
- http://localhost:3000/apple-photos-gallery/api/data
- http://localhost:3000/astronauts/api/data
- http://localhost:3000/day-calendar/api/data
- http://localhost:3000/the-onion-editorial-cartoon/api/data
- http://localhost:3000/duden-wort-des-tages/api/data
- http://localhost:3000/simple-calendar/api/data
- http://localhost:3000/formula-1-races/api/data
- http://localhost:3000/opening-hours/api/data
- http://localhost:3000/uptime-kuma-monitor/api/data

## Self-hosting Behind A Domain

- https://mydocker.de/xkcd/
- https://mydocker.de/weather/
- https://mydocker.de/quote/
- https://mydocker.de/apple-photos-gallery/
- https://mydocker.de/astronauts/
- https://mydocker.de/day-calendar/
- https://mydocker.de/the-onion-editorial-cartoon/
- https://mydocker.de/duden-wort-des-tages/
- https://mydocker.de/simple-calendar/
- https://mydocker.de/formula-1-races/
- https://mydocker.de/opening-hours/
- https://mydocker.de/uptime-kuma-monitor/

All render pages use relative API URLs and shared `/assets/paperless.css` and `/assets/paperless.iife.js` helper files. The checked-in files are minimal fallbacks; `npm install` and the Docker build copy the package-provided assets from `node_modules/@paperlesspaper/openintegration/dist` when they are available.
