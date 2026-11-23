# GitHub Activity

A contribution calendar with annual total, visible total and active days.

## Setup

Use a GitHub token and username. Fetches contributionsCollection and the contributionCalendar from GraphQL. Visibility follows the token and profile privacy settings. The annual total is GitHub’s rolling contribution year; visible total refers only to the selected weeks. Filled cells mean one or more contributions; tooltips contain exact counts.

Provider reference: [GitHub Activity documentation](https://docs.github.com/en/graphql/reference).

## Settings

| Setting      | Default           | Purpose                |
| ------------ | ----------------- | ---------------------- |
| `title`      | `""`              | Custom display title   |
| `sampleData` | `false`           | Use labelled demo data |
| `timeZone`   | `"Europe/Berlin"` | Display time zone      |
| `token`      | `""`              | GitHub access token    |
| `username`   | `""`              | GitHub username        |
| `weeks`      | `26`              | Visible weeks          |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/github-activity/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=github-activity node scripts/check-connected-integrations.mjs
```
