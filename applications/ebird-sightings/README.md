# Nearby Bird Sightings

Recent bird observations around your chosen location.

## Setup

Get an eBird API key from Cornell Lab. Results show the most recent observation for each species within the radius/lookback, not all individual sightings. At most 100 observations are loaded. Provisional observations are excluded. Observations retain their local civil timestamp. No observer identity or photographs are requested.

Provider reference: [Nearby Bird Sightings documentation](https://documenter.getpostman.com/view/664302/S1ENwy59).

## Settings

| Setting        | Default           | Purpose                     |
| -------------- | ----------------- | --------------------------- |
| `title`        | `""`              | Custom display title        |
| `sampleData`   | `false`           | Use labelled demo data      |
| `timeZone`     | `"Europe/Berlin"` | Display time zone           |
| `locationName` | `""`              | Location name               |
| `latitude`     | `52.52`           | Latitude                    |
| `longitude`    | `13.405`          | Longitude                   |
| `apiKey`       | `""`              | eBird API key               |
| `radiusKm`     | `25`              | Search radius (km)          |
| `days`         | `7`               | Observation lookback (days) |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/ebird-sightings/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=ebird-sightings node scripts/check-connected-integrations.mjs
```
