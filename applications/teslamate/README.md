# TeslaMate Vehicle

Read your TeslaMate vehicle snapshot through its supported MQTT integration.

## Setup

Use a read-only MQTT account with access to teslamate/cars/<carId> topics. Enable the exact broker URL in PAPERLESSPAPER_MQTT_BROKERS. The adapter subscribes to selected fields for a bounded snapshot and disconnects; it never publishes or wakes the car. Retained values have no per-measurement timestamps. The status-change timestamp is not a measurement timestamp. TLS verification stays enabled; use trusted certificates for mqtts.

Provider reference: [TeslaMate Vehicle documentation](https://docs.teslamate.org/docs/integrations/mqtt/).

## Settings

| Setting      | Default                   | Purpose                |
| ------------ | ------------------------- | ---------------------- |
| `title`      | `""`                      | Custom display title   |
| `sampleData` | `false`                   | Use labelled demo data |
| `timeZone`   | `"Europe/Berlin"`         | Display time zone      |
| `brokerUrl`  | `"mqtt://mosquitto:1883"` | MQTT broker            |
| `username`   | `""`                      | MQTT username          |
| `password`   | `""`                      | MQTT password          |
| `carId`      | `1`                       | TeslaMate car ID       |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/teslamate/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=teslamate node scripts/check-connected-integrations.mjs
```
