# Snow Report

Modelled snow depth, forecast snowfall and optional lift/run status.

## Setup

Select the ski area coordinates and location name. Snow depth is an Open-Meteo model value, converted from metres to centimetres. Snowfall is daily forecast accumulation in centimetres. It is not an observed piste measurement. Optionally provide a JSON endpoint with updatedAt (ISO), liftsOpen, liftsTotal, runsOpen, runsTotal. Configure the server origin allowlist for a private feed. The status source timestamp is shown. The free Open-Meteo endpoint is for eligible non-commercial use; set weatherApiKey for the commercial customer endpoint.

Provider reference: [Snow Report documentation](https://open-meteo.com/en/docs).

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
| `resortFeedUrl` | `""`              | Optional resort status JSON URL          |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/snow-report/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=snow-report node scripts/check-connected-integrations.mjs
```
