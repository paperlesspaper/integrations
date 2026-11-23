# Shopify Shop

Orders, net payments and pending shipments for Shopify.

## Setup

Create a merchant-authorized app with read_orders and enter its Admin API token. Use the permanent myshopify.com domain, not a custom storefront domain. GraphQL API is pinned to 2026-07. Uses netPaymentSet (received less refunded), shop currency and fulfillment state. Shared with WooCommerce: period, currency handling, formatting, summary and demo fixtures. Test/cancelled orders are excluded. Period is at most 30 days; at most 500 orders. No customer names or addresses are fetched.

Provider reference: [Shopify Shop documentation](https://shopify.dev/docs/api/admin-graphql/2026-07/objects/Order).

## Settings

| Setting       | Default           | Purpose                           |
| ------------- | ----------------- | --------------------------------- |
| `title`       | `""`              | Custom display title              |
| `sampleData`  | `false`           | Use labelled demo data            |
| `timeZone`    | `"Europe/Berlin"` | Display time zone                 |
| `shopDomain`  | `""`              | Shop domain (store.myshopify.com) |
| `accessToken` | `""`              | Shopify Admin API access token    |
| `days`        | `7`               | Period including today (days)     |
| `currency`    | `"EUR"`           | Display currency (ISO)            |

Global `color` follows the host selection. German and English are selected by `payload.meta.language`. Both light/dark color variants and portrait/landscape sizes are included. Demo data is opt-in and visibly labelled. Credentials travel in the same-origin POST body, not the render URL.

The shared renderer lives in the sibling openintegration source (`src/dashboard.ts`); the API adapter is local. Long lists disclose omitted rows. Provider failures show a setup/error state, never fabricated zeros.

## Validation

```sh
npx paperless check applications/shopify/config.json
node --test tests/connected-integrations.test.mjs
PAPERLESSPAPER_TEST_SLUGS=shopify node scripts/check-connected-integrations.mjs
```
