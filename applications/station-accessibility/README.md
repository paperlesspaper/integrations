# Station Accessibility

Elevator and escalator status at selected DB stations.

## Setup

Subscribe to FaSta in the DB API Marketplace. Enter DB-Client-Id and DB-Api-Key and up to five station numbers (not EVA IDs). Choose elevators or all facilities. ACTIVE, INACTIVE and UNKNOWN remain distinct. Failed station requests appear as unavailable and make the dashboard partial. Empty results do not imply step-free access.

Provider reference: [Station Accessibility documentation](https://developers.deutschebahn.com/db-api-marketplace/apis/product/fasta/api/88996).

## Settings

| Setting        | Default           | Purpose                             |
| -------------- | ----------------- | ----------------------------------- |
| `title`        | `""`              | Custom display title                |
| `sampleData`   | `false`           | Use labelled demo data              |
| `timeZone`     | `"Europe/Berlin"` | Display time zone                   |
| `stationIds`   | `"1071"`          | DB station numbers, comma-separated |
| `clientId`     | `""`              | DB API client ID                    |
| `apiKey`       | `""`              | DB API key                          |
| `facilityType` | `"elevators"`     | Facilities                          |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/station-accessibility/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=station-accessibility node scripts/check-connected-integrations.mjs
```
