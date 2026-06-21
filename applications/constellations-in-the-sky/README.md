# Constellations in the Sky

Displays a seasonal constellation sky map for paperlesspaper. The app draws a stable eInk-friendly star field, constellation line art, localized labels, and one highlighted constellation.

## Links

- [Demo](https://integrations.paperlesspaper.de/constellations-in-the-sky/run)
- [config.json](./config.json)

## Screenshots

| Landscape | Portrait |
| --- | --- |
| <img src="./screenshots/constellations-south-daily-800x480-landscape.png" alt="Constellations in the Sky landscape screenshot: Constellations South Daily" width="360"> | <img src="./screenshots/constellations-south-daily-480x800-portrait.png" alt="Constellations in the Sky portrait screenshot: Constellations South Daily" width="216"> |
| <img src="./screenshots/constellations-winter-orion-800x480-landscape.png" alt="Constellations in the Sky landscape screenshot: Constellations Winter Orion" width="360"> | <img src="./screenshots/constellations-winter-orion-480x800-portrait.png" alt="Constellations in the Sky portrait screenshot: Constellations Winter Orion" width="216"> |

## API

The integration does not need an external astronomy API. Constellation line art and names are stable enough to ship as a built-in catalogue in `api/data.js`, which makes rendering deterministic and keeps the app working without API keys or network access.

Useful live astronomy APIs do exist for other use cases:

- weather or cloud cover: Open-Meteo, DWD, NOAA
- object positions and ephemerides: NASA/JPL Horizons, IMCCE, AstronomyAPI
- star catalogues: VizieR/SIMBAD, Gaia archives

Those are heavier than this display needs because the integration shows recognizable constellation patterns, not precise real-time sky simulation.

## Settings

- `hemisphere`: northern or southern sky.
- `season`: automatic seasonal selection or a pinned season.
- `highlight`: daily rotating highlight, no highlight, or a pinned constellation.
- `showLabels`: show or hide constellation names.
- `showMilkyWay`: draw a soft background band.
- `density`: background star density.

## Local URLs

```txt
http://localhost:3000/constellations-in-the-sky/
http://localhost:3000/constellations-in-the-sky/config.json
http://localhost:3000/constellations-in-the-sky/api/data
```
