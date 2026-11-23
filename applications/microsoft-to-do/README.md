# Microsoft To Do

Your Microsoft To Do list with due dates and important tasks.

## Setup

Register a Microsoft Entra application. Use delegated Tasks.Read and offline_access. Enter an access token for a temporary setup, or a refresh token plus client ID and, for confidential apps, client secret. Refresh tokens are renewed in server memory; persist/reissue rotated credentials before a server restart if required by your tenant. No automatic OAuth consent UI is included. Leave listId empty for the default list. Up to 500 tasks are fetched, completed tasks are excluded.

Provider reference: [Microsoft To Do documentation](https://learn.microsoft.com/en-us/graph/api/todotasklist-list-tasks?view=graph-rest-1.0).

## Settings

| Setting        | Default           | Purpose                                   |
| -------------- | ----------------- | ----------------------------------------- |
| `title`        | `""`              | Custom display title                      |
| `sampleData`   | `false`           | Use labelled demo data                    |
| `timeZone`     | `"Europe/Berlin"` | Display time zone                         |
| `accessToken`  | `""`              | Access token (or use refresh token below) |
| `refreshToken` | `""`              | OAuth refresh token                       |
| `clientId`     | `""`              | OAuth client ID                           |
| `clientSecret` | `""`              | OAuth client secret                       |
| `tenant`       | `"common"`        | Microsoft tenant                          |
| `listId`       | `""`              | Task list ID (empty = default list)       |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/microsoft-to-do/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=microsoft-to-do node scripts/check-connected-integrations.mjs
```
