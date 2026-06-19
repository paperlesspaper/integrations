---
slug: weather
name: Weather
version: 0.1.0
description: Shows current weather and a three-day forecast from Open-Meteo.
renderPage: ./render.html
configUrl: /weather/config.json
apiUrl: /weather/api/data
screenshots:
  - ./screenshots/weather-berlin-1600x1200-landscape.png
  - ./screenshots/weather-berlin-1200x1600-portrait.png
  - ./screenshots/weather-berlin-800x480-landscape.png
  - ./screenshots/weather-berlin-480x800-portrait.png
  - ./screenshots/weather-new-york-1600x1200-landscape.png
  - ./screenshots/weather-new-york-1200x1600-portrait.png
  - ./screenshots/weather-new-york-800x480-landscape.png
  - ./screenshots/weather-new-york-480x800-portrait.png
---

# Weather

Plain OpenIntegration dashboard for current conditions and a compact forecast. It uses Open-Meteo, requires no API key, and fits the city title with `fitAllText(...)` before calling `markReady()`.

## Common URLs

- `/weather/`
- `/weather/?city=Berlin&latitude=52.52&longitude=13.405`
- `/weather/?city=New%20York&latitude=40.7128&longitude=-74.0060`
- `/weather/config.json`
- `/weather/api/data`

## Settings

- `city`: display label for the location
- `latitude`: forecast latitude
- `longitude`: forecast longitude

## Language Support

This integration declares `language: ["en", "de", "fr", "es", "it"]` in `config.json` and loads localized fixed UI copy from `languages/<code>.json` using the host-selected `payload.meta.language`.

The language JSON files localize dashboard labels, empty states, update text, and error titles only. Integration settings such as `locale`, `language`, or external API language codes remain separate.
