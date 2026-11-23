# Bring! Shopping List

Read a shared Bring! shopping list. Completed items are excluded.

## Setup

Enter your Bring! email and password. Leave listId empty for the first list, or provide a list UUID. This uses the unofficial Bring! web interface documented by node-bring-api; provider changes can break it. Only authentication and read requests are made. Product names come from Bring! and may use its internal catalog language.

Provider reference: [Bring! Shopping List documentation](https://github.com/foxriver76/node-bring-api).

## Settings

| Setting      | Default           | Purpose                        |
| ------------ | ----------------- | ------------------------------ |
| `title`      | `""`              | Custom display title           |
| `sampleData` | `false`           | Use labelled demo data         |
| `timeZone`   | `"Europe/Berlin"` | Display time zone              |
| `email`      | `""`              | Bring! account email           |
| `password`   | `""`              | Bring! password                |
| `listId`     | `""`              | List UUID (empty = first list) |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/bring-shopping/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=bring-shopping node scripts/check-connected-integrations.mjs
```
