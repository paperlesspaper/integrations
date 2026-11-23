# Trello Board

A compact Kanban board with up to three selected Trello lists.

## Setup

Generate a Trello Power-Up API key and authorize a token with scope=read. Enter a board ID and optionally up to three list IDs. Empty listIds selects the first three open lists. Lists and cards retain board order. Archived cards are excluded. Authentication uses the Authorization header, not URL parameters.

Provider reference: [Trello Board documentation](https://developer.atlassian.com/cloud/trello/guides/rest-api/authorization/).

## Settings

| Setting      | Default           | Purpose                               |
| ------------ | ----------------- | ------------------------------------- |
| `title`      | `""`              | Custom display title                  |
| `sampleData` | `false`           | Use labelled demo data                |
| `timeZone`   | `"Europe/Berlin"` | Display time zone                     |
| `apiKey`     | `""`              | Trello API key                        |
| `token`      | `""`              | Trello read token                     |
| `boardId`    | `""`              | Board ID                              |
| `listIds`    | `""`              | Up to three list IDs, comma-separated |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/trello/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=trello node scripts/check-connected-integrations.mjs
```
