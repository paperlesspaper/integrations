# GitHub Reviews & CI

Open pull requests, requested reviews and CI status of the latest commit.

## Setup

Use a GitHub token that can read the selected repositories and their pull request/check data. Private repositories need appropriate repository access. Choose review-requested, author or involves. CI uses the latest commit statusCheckRollup; missing checks remain unknown. At most 50 PRs are loaded; total count and truncation are shown.

Provider reference: [GitHub Reviews & CI documentation](https://docs.github.com/en/graphql/reference).

## Settings

| Setting      | Default              | Purpose                          |
| ------------ | -------------------- | -------------------------------- |
| `title`      | `""`                 | Custom display title             |
| `sampleData` | `false`              | Use labelled demo data           |
| `timeZone`   | `"Europe/Berlin"`    | Display time zone                |
| `token`      | `""`                 | GitHub access token              |
| `username`   | `""`                 | GitHub username                  |
| `mode`       | `"review-requested"` | Pull requests to display         |
| `repository` | `""`                 | Optional owner/repository filter |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/github-pull-requests/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=github-pull-requests node scripts/check-connected-integrations.mjs
```
