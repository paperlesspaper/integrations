# Tides

Upcoming high and low tides and predicted water level from NOAA.

## Setup

NOAA CO-OPS supports US coastal stations; this adapter does not cover German coastal gauges. Enter a seven-digit prediction station ID. Heights are metres above MLLW; NOAA times are requested in GMT and displayed in your selected time zone. Subordinate stations may only provide high/low events, in which case the curve is omitted and partial data is indicated.

Provider reference: [Tides documentation](https://api.tidesandcurrents.noaa.gov/api/prod/).

## Settings

| Setting       | Default           | Purpose                |
| ------------- | ----------------- | ---------------------- |
| `title`       | `""`              | Custom display title   |
| `sampleData`  | `false`           | Use labelled demo data |
| `timeZone`    | `"Europe/Berlin"` | Display time zone      |
| `stationId`   | `"9414290"`       | NOAA station ID        |
| `stationName` | `"San Francisco"` | Station label          |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/tides/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=tides node scripts/check-connected-integrations.mjs
```
