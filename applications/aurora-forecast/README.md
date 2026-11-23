# Aurora Forecast

NOAA auroral oval model at your location with nighttime cloud forecast.

## Setup

Select a location. The adapter selects the nearest NOAA OVATION grid cell; the displayed model percentage is not a local visual-observation probability. Cloud cover for the next six forecast nighttime hours comes from Open-Meteo. NOAA forecasts older than three hours are flagged. Missing cloud data never becomes clear sky. Set weatherApiKey for commercial Open-Meteo use.

Provider reference: [Aurora Forecast documentation](https://www.swpc.noaa.gov/products/aurora-30-minute-forecast).

## Settings

| Setting         | Default           | Purpose                                  |
| --------------- | ----------------- | ---------------------------------------- |
| `title`         | `""`              | Custom display title                     |
| `sampleData`    | `false`           | Use labelled demo data                   |
| `timeZone`      | `"Europe/Berlin"` | Display time zone                        |
| `locationName`  | `""`              | Location name                            |
| `latitude`      | `52.52`           | Latitude                                 |
| `longitude`     | `13.405`          | Longitude                                |
| `weatherApiKey` | `""`              | Open-Meteo commercial API key (optional) |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/aurora-forecast/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=aurora-forecast node scripts/check-connected-integrations.mjs
```
