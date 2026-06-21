---
slug: astronauts
name: Astronauts
version: 0.1.0
description: Shows the current people in space, grouped by spacecraft or station.
renderPage: ./render.html
configUrl: /astronauts/config.json
apiUrl: /astronauts/api/data
screenshots: []
---

# Astronauts

Plain OpenIntegration dashboard for the live people-in-space roster. It uses the public "How Many People Are In Space Right Now?" JSON feed, requires no API key, and groups the current crew by spacecraft or station.

## Links

- [Demo](https://integrations.paperlesspaper.de/astronauts/run)
- [config.json](./config.json)

## Screenshots

| Landscape | Portrait |
| --- | --- |
| <img src="./screenshots/astronauts-all-crew-800x480-landscape.png" alt="Astronauts landscape screenshot: All Crew" width="360"> | <img src="./screenshots/astronauts-all-crew-480x800-portrait.png" alt="Astronauts portrait screenshot: All Crew" width="216"> |
| <img src="./screenshots/astronauts-iss-compact-800x480-landscape.png" alt="Astronauts landscape screenshot: Iss Compact" width="360"> | <img src="./screenshots/astronauts-iss-compact-480x800-portrait.png" alt="Astronauts portrait screenshot: Iss Compact" width="216"> |

## Common URLs

- `/astronauts/`
- `/astronauts/?rosterLimit=12`
- `/astronauts/?locationFilter=ISS`
- `/astronauts/?showPortraits=false`
- `/astronauts/config.json`
- `/astronauts/api/data`

## Settings

- `locationFilter`: optional station or spacecraft text filter
- `rosterLimit`: number of crew entries to show
- `showPortraits`: whether to render grayscale crew portraits


## Language Support

This integration declares `language: ["en", "de", "fr", "es", "it"]` in `config.json` and loads localized UI copy from `languages/<code>.json` using the host-selected `payload.meta.language`.

The language JSON files localize the fixed dashboard labels only; live astronaut names, spacecraft names, countries, and source data remain unchanged from the upstream feed.
