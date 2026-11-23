# Plant Care

Watering and feeding reminders based on your own care schedule.

## Setup

Use the plant editor to enter names, locations, last care dates and intervals. Dates are civil dates in the selected time zone. Empty last-care dates remain explicitly unknown. Fertilizing is disabled when its interval is 0. This is a reminder based on your chosen interval, not a diagnosis or sensor reading. The display is read-only; update care dates in settings.

## Settings

| Setting      | Default           | Purpose                |
| ------------ | ----------------- | ---------------------- |
| `title`      | `""`              | Custom display title   |
| `sampleData` | `false`           | Use labelled demo data |
| `timeZone`   | `"Europe/Berlin"` | Display time zone      |
| `plants`     | `"[]"`            | Plants (JSON array)    |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/plant-care/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=plant-care node scripts/check-connected-integrations.mjs
```
