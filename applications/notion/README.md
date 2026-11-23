# Notion Database

Display pages from a Notion data source with status and a selected detail.

## Setup

Create a Notion integration with read-content access and share the data source with it. Use the data source ID, not the parent database ID. API version 2026-03-11. Optional status/detail settings name exact properties. filterJson accepts the documented Notion filter object. Fetches up to 500 pages and marks incomplete results.

Provider reference: [Notion Database documentation](https://developers.notion.com/reference/query-a-data-source).

## Settings

| Setting          | Default           | Purpose                       |
| ---------------- | ----------------- | ----------------------------- |
| `title`          | `""`              | Custom display title          |
| `sampleData`     | `false`           | Use labelled demo data        |
| `timeZone`       | `"Europe/Berlin"` | Display time zone             |
| `token`          | `""`              | Notion integration token      |
| `dataSourceId`   | `""`              | Notion data source ID         |
| `statusProperty` | `"Status"`        | Status property name          |
| `detailProperty` | `""`              | Detail property name          |
| `filterJson`     | `""`              | Optional Notion filter (JSON) |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/notion/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=notion node scripts/check-connected-integrations.mjs
```
