# EVCC Charging

Battery, charging power, energy added and solar share for an EVCC charge point.

## Setup

Enter your EVCC base URL and the 1-based loadpoint number. The server must reach EVCC. Authorize its exact origin with PAPERLESSPAPER_PRIVATE_API_ORIGINS. The optional token is for a reverse proxy. EVCC energy fields are kWh; power is W and is displayed as kW. No charging commands are sent.

Provider reference: [EVCC Charging documentation](https://docs.evcc.io/integrations/rest-api/operations/getstate/).

## Settings

| Setting      | Default                    | Purpose                               |
| ------------ | -------------------------- | ------------------------------------- |
| `title`      | `""`                       | Custom display title                  |
| `sampleData` | `false`                    | Use labelled demo data                |
| `timeZone`   | `"Europe/Berlin"`          | Display time zone                     |
| `baseUrl`    | `"http://evcc.local:7070"` | EVCC base URL                         |
| `token`      | `""`                       | Reverse-proxy bearer token (optional) |
| `loadpoint`  | `1`                        | Loadpoint number (1-based)            |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/evcc/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=evcc node scripts/check-connected-integrations.mjs
```
