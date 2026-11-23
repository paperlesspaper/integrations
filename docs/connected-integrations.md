# Connected integrations

18 integrations added from the selected TRMNL-inspired concepts. All are read-only, except the local plant-settings editor, which updates integration settings. `sampleData` is disabled by default; preview variants enable it explicitly.

| Idea | Integration | Live data / setup |
| --- | --- | --- |
| 1 | [Bring!](../applications/bring-shopping/README.md) | Email/password; optional list UUID; unofficial Bring! web API; locally suggested categories and product symbols |
| 2 | [Plant care](../applications/plant-care/README.md) | Local plant editor, watering/feeding dates and intervals; no account |
| 6 | [EVCC](../applications/evcc/README.md) | Local REST API, loadpoint number |
| 7 | [TeslaMate](../applications/teslamate/README.md) | Supported MQTT topics, read-only broker account |
| 9 | [Notion](../applications/notion/README.md) | Integration token, shared data source ID; version 2026-03-11 |
| 11 | [Microsoft To Do](../applications/microsoft-to-do/README.md) | Delegated Tasks.Read; access token or refresh-token credentials |
| 12 | [Trello](../applications/trello/README.md) | Read token, API key, board and optional list IDs |
| 17 | [GitHub Reviews & CI](../applications/github-pull-requests/README.md) | GitHub token, username, optional repository; latest-commit checks |
| 18 | [GitHub Activity](../applications/github-activity/README.md) | GitHub GraphQL contribution calendar |
| 21 | [UniFi](../applications/unifi/README.md) | Local Network Integration API key; optional site UUID; gateway rates retain the upstream `Bps` unit |
| 28 | [Tides](../applications/tides/README.md) | NOAA CO-OPS; **US prediction stations only**, MLLW datum |
| 29 | [Snow report](../applications/snow-report/README.md) | Open-Meteo modelled depth/snowfall; optional resort JSON for lift/run status |
| 30 | [Aurora](../applications/aurora-forecast/README.md) | NOAA OVATION grid and Open-Meteo nighttime clouds |
| 31 | [eBird](../applications/ebird-sightings/README.md) | Cornell API key, coordinates, radius |
| 32 | [Station accessibility](../applications/station-accessibility/README.md) | DB FaSta credentials and station numbers, not EVA IDs |
| 38 | [WooCommerce](../applications/woocommerce/README.md) | Read-only WooCommerce REST credentials |
| 38 | [Shopify](../applications/shopify/README.md) | Admin API token with read_orders; version 2026-07 |
| 39 | [YouTube Analytics](../applications/youtube-analytics/README.md) | Google OAuth: yt-analytics.readonly and youtube.readonly |

## Shared implementation

The canonical renderer and CSS are in the sibling `paperlesspaper-openintegration/src/dashboard.ts` and `src/styles/paperless.css`. The built snapshot is synced to `vendor/openintegration`; `npm install` refreshes browser assets. Provider-specific adapters stay in this repository. `applications/_shared/commerce.js` is the common WooCommerce/Shopify basis for date boundaries, currency selection, summaries and fixtures. `connected-api.js` provides bounded normalization, dates, safe pagination and server-side OAuth refresh.

Both shops describe orders **created within the chosen period**. They exclude cancelled/test orders and never combine currencies. WooCommerce subtracts refunds; Shopify uses `netPaymentSet`. Values include taxes and shipping. This is a display summary, not accounting revenue or a complete shipping backlog. Requests stop after 500 orders and label partial totals.

The existing shared HTTP transport now supports POST bodies, includes method/body in cache keys, and refuses redirects for authenticated requests and POSTs. No credentials are placed in browser API URLs. MQTT requires its own explicit operator allowlist:

```sh
PAPERLESSPAPER_PRIVATE_API_ORIGINS=http://evcc.local:7070,https://unifi.local
PAPERLESSPAPER_MQTT_BROKERS=mqtt://mosquitto:1883
```

Use `NODE_EXTRA_CA_CERTS` for a trusted private CA. TLS validation is not disabled. Microsoft and Google refresh tokens are exchanged on the server; refreshed access tokens and any rotated refresh token are cached in process memory. OAuth consent and durable rotated-token storage are not included; see each provider README.

## Display and validation

All 18 integration-list icons were generated individually with the built-in Image Gen tool on 2026-10-03. The original 1254×1254 RGBA PNGs replace the earlier vector exports at each integration's `assets/icon.png`; they are copied without pixel postprocessing. The obsolete SVG icon drafts and their generator were removed. Prompts, source filenames, destination paths and SHA-256 checksums are recorded in [`connected-icon-generation.json`](./connected-icon-generation.json). Run `node scripts/check-connected-icons.mjs` to check PNG dimensions, alpha transparency, manifest references and checksums, and generate `output/connected-integrations/icons.html` with large and small previews on light and dark surfaces.

German and English text follow host language. The host color selection is preserved. Each integration has colored light, the corresponding existing colored-text theme, and black-background `dark` variants at 800×480, 480×800, 1600×1200 and 1200×1600.

The page requests the native Spectra 6 palette, disables photographic tone/range transforms for UI artwork, and retains error-diffusion dithering for orange. Raw PNGs and processed EPD PNGs are stored in each integration's `screenshots/` directory. The render checker tests INIT updates, language/theme changes, errors, overflow and off-screen elements, then builds `output/connected-integrations/index.html` and `layout-report.json`.

```sh
npm run check:connected
node --test tests/*.test.mjs
```

Provider accounts and private devices are tested with representative fixtures until real credentials are configured. Public NOAA/Open-Meteo adapters have additionally been exercised against live endpoints. Bring!'s unofficial API, local MQTT values without individual timestamps, US-only tides, modelled snow and optional resort status are explicit limitations rather than demo fallbacks.

The implementation was checked with 63 connected-adapter tests and 118 shared-library tests. All 216 rendered layout variants passed without overflow; 108 processed EPD previews were generated. Host updates and error replacement passed for all 18 integrations, and the plant editor passed initialization, add, care-date edit, language-update and removal checks. Representative processed previews were also inspected visually.
