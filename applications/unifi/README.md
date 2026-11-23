# UniFi Network

UniFi device availability and connected client count.

## Setup

Requires the official UniFi Network Integration API with an API key. UniFi OS uses /proxy/network/integration/v1; standalone Network uses /integration/v1. Enable the origin via PAPERLESSPAPER_PRIVATE_API_ORIGINS for local access. HTTPS certificates must be trusted; NODE_EXTRA_CA_CERTS can provide your private CA. An offline device is not proof that the Internet connection is down. Up to 500 devices are fetched.

Provider reference: [UniFi Network documentation](https://developer.ui.com/network/v10.0.162).

## Settings

| Setting       | Default                 | Purpose                                |
| ------------- | ----------------------- | -------------------------------------- |
| `title`       | `""`                    | Custom display title                   |
| `sampleData`  | `false`                 | Use labelled demo data                 |
| `timeZone`    | `"Europe/Berlin"`       | Display time zone                      |
| `baseUrl`     | `"https://unifi.local"` | UniFi console base URL                 |
| `apiKey`      | `""`                    | UniFi Network API key                  |
| `siteId`      | `""`                    | Site UUID (optional for a single site) |
| `consoleType` | `"unifi-os"`            | Console type                           |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/unifi/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=unifi node scripts/check-connected-integrations.mjs
```
