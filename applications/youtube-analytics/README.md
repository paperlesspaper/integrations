# YouTube Analytics

Channel views, watch time, subscriber growth and your newest video.

## Setup

Enable YouTube Analytics API and YouTube Data API v3 in a Google Cloud project. Authorize your own channel with yt-analytics.readonly and youtube.readonly, requesting offline access. Enter refresh token/client ID/client secret, or a short-lived access token. No OAuth consent UI is included. Google testing-mode refresh tokens may expire; configure the consent screen for your intended usage. Analytics may lag. Days use YouTube’s Pacific reporting calendar. Total subscriber count may be rounded or hidden.

Provider reference: [YouTube Analytics documentation](https://developers.google.com/youtube/analytics/reference/reports/query).

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
| `days`         | `7`               | Completed report days                     |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/youtube-analytics/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=youtube-analytics node scripts/check-connected-integrations.mjs
```
