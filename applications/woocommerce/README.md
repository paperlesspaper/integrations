# WooCommerce Shop

Orders, paid order value and pending shipments for WooCommerce.

## Setup

Create a WooCommerce REST API key with Read permission. Use HTTPS and enter the store base URL. Uses wc/v3/orders. The shared commerce calculation excludes cancelled/failed orders, subtracts refunds, and sums only the selected currency. Pending shipments refer to orders created in the selected period, not the complete backlog. Includes tax and shipping. At most 500 orders are fetched and incomplete totals are labelled.

Provider reference: [WooCommerce Shop documentation](https://developer.woocommerce.com/docs/apis/rest-api/v3/orders/).

## Settings

| Setting          | Default           | Purpose                       |
| ---------------- | ----------------- | ----------------------------- |
| `title`          | `""`              | Custom display title          |
| `sampleData`     | `false`           | Use labelled demo data        |
| `timeZone`       | `"Europe/Berlin"` | Display time zone             |
| `storeUrl`       | `""`              | WooCommerce store URL         |
| `consumerKey`    | `""`              | Read-only consumer key        |
| `consumerSecret` | `""`              | Consumer secret               |
| `days`           | `7`               | Period including today (days) |
| `currency`       | `"EUR"`           | Display currency (ISO)        |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/woocommerce/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=woocommerce node scripts/check-connected-integrations.mjs
```
