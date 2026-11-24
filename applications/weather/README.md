---
slug: weather
name: Weather
version: 0.1.1
description: Shows current weather, hourly forecast, or a compact forecast summary from OpenWeatherMap or Open-Meteo.
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

Plain OpenIntegration version of the old paperlesspaper weather app. It keeps the old settings and views while using the new no-React structure: `config.json`, `render.html`, localized JSON files, and `api/data.js`.

The API adapter supports OpenWeatherMap and Open-Meteo. OpenWeatherMap is the default and requires `OPENWEATHERMAP_API_KEY` in the server environment; for local one-off tests, `apiKey` can also be passed as a query setting. Open-Meteo can be selected with `dataSource=open-meteo` and does not require an API key for the public endpoint.

## Links

- [Demo](https://integrations.paperlesspaper.de/weather/run)
- [config.json](./config.json)

## Common URLs

- `/weather/`
- `/weather/?location=Berlin&color=light&kind=forecast-summary`
- `/weather/?dataSource=open-meteo&location=Berlin&color=light&kind=forecast-summary`
- `/weather/?location=Dresden&color=dark&kind=forecast`
- `/weather/?location=New%20York&color=light&kind=today-forecast&displayLastUpdated=true`
- `/weather/?location=Berlin&iconset=glyphs-poly`
- `/weather/?location=Berlin&iconstyle=openweather`
- `/weather/?location=Berlin&showDate=true&showSunTimes=true&showMoonPhase=true&showPressure=true`
- `/weather/config.json`
- `/weather/api/data`

## Settings

- `dataSource`: `openweathermap` or `open-meteo`
- `location`: city or place name passed to the selected data source
- `color`: global paperlesspaper color theme
- `kind`: `forecast-summary`, `forecast`, or `today-forecast`
- `displayLastUpdated`: show the weather timestamp and render timestamp
- `iconset`: `normal`, `light`, `qweather`, `qweather-line`, `glyphs-poly`, `noto-emoji`, `openmoji`, or `openweather`
- `showDate`: show the local date for the weather location
- `showSunTimes`: show sunrise and sunset for the current location
- `showMoonPhase`: show the current moon phase, calculated locally for the weather date
- `showPressure`: show current and forecast air pressure
- `showWindSpeed`: show current and forecast wind speed
- `showHumidity`: show current and forecast humidity

`iconstyle` is still supported as a URL alias for the old app. `apiKey` is still supported as a URL-only override for OpenWeatherMap.

## Views

- `forecast-summary`: current weather, four near-term forecast slots, and a three-day outlook
- `forecast`: seven forecast rows with time, weekday, temperature, description, icon, and humidity
- `today-forecast`: current temperature, description, humidity, and wind speed

Saved papers from the original weather app can continue using `kind=simple` or
`kind=default` for the current-weather view. Existing `iconstyle`, location,
theme, language and update-time query parameters are preserved. The render page
uses the shared OpenIntegration INIT/readiness protocol, including when embedded
next to Google Calendar in a Layout; no server-side legacy bridge is required.

## Language Support

This integration declares `language: ["en", "de", "nl", "fr", "es", "it"]` in `config.json` and loads fixed UI copy from `languages/<code>.json` using the host-selected `payload.meta.language`.

## Regression check

Run `WEATHER_BROWSER_TESTS=1 node --test tests/weather-layout.test.mjs` from the
repository root (set `CHROME_BIN` outside macOS). The test uses local synthetic
weather data and the real render pages. It checks legacy views and language,
cross-origin Calendar + Weather layouts in both orientations, and child failure
propagation without Puppeteer-injected compatibility code. Set
`WEATHER_REVIEW_DIR=/tmp/weather-review` to save the composed screenshots.
