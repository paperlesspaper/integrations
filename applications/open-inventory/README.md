# Open Inventory for Paperlesspaper

This directory is the canonical source of the **Open Inventory** Paperlesspaper
Open Integration. It is independent of the Next.js app and can be copied into
`paperlesspaper-integrations/applications/open-inventory/` without changing imports.
It uses the same manifest, settings protocol, server-side data adapter and shared
dashboard renderer as the other Paperlesspaper integrations.

## Setup in Paperlesspaper

1. Install `<integration-provider-url>/open-inventory/config.json`.
2. Open its settings and enter your **Open Inventory instance URL** and **API key**.
   Use an Open Inventory token (`inv_…`) with the `read` scope. User-linked tokens
   additionally need the user's `stock.read` permission. The token's organization
   determines the inventory. Both `https://inventory.example.com` and
   `https://inventory.example.com/api/v1` work, including a deployment subpath.
3. Select **Test connection & load items**, then all stock-tracked items or one item.
4. Choose the overview or low/empty-stock view, optional name/SKU filter, row limit,
   title and time zone. Save the paper and assign it to a frame.

All configuration lives in the Paperlesspaper settings page. The API key is stored
as a normal integration setting, matching the other API-key integrations; the
password input masks it visually, it is not a separate server-side secret vault.
Connection tests and rendering send credentials in JSON POST bodies to this
provider. Only its backend sends the key to Open Inventory, as a Bearer header.
Credentials are never put into URLs or returned in adapter responses. Use a trusted
provider and HTTPS. The adapter is read-only and does not create webhooks or bookings.

## Data and refresh

The adapter reads `GET /api/v1/stock`, using its actual `items` response. It shows
**recorded on-hand stock**, minimum stock and outstanding purchase quantities,
not reservation-adjusted availability. Only stock-tracked items are included.
Unknown values stay unknown. Low stock means a positive quantity at or below a
positive minimum; zero/negative stock is marked empty. Items are ordered empty,
low, unknown, then OK. Overview metrics count items and never add unlike units.
Single-item metrics retain that item's own values; family parent quantities may
already include variants according to Open Inventory's own stock model.

The name/SKU filter applies to the all-items view. The low-stock view additionally
filters displayed rows, while summary metrics describe the selected scope.
The display discloses rows omitted by the configured limit or available screen space.
Requests are bounded to 2 MiB, 5,000 stock items and the shared transport deadline.
Oversized or malformed responses fail visibly instead of showing partial totals.

Fresh data is fetched when Paperlesspaper renders the paper, according to the
host's refresh schedule. No instant push or display wake-up is implemented.
The footer shows retrieval time. Connection errors replace the previous dashboard;
sample data is used only when explicitly enabled and is always labelled.

Private/LAN sources require reachability from the integration provider and its
existing operator allowlist, for example:

```sh
PAPERLESSPAPER_PRIVATE_API_ORIGINS=http://inventory.local:3000
```

Public sources require HTTPS. Authenticated redirects are refused; use the final
instance URL. Custom CA certificates use `NODE_EXTRA_CA_CERTS`; TLS stays verified.

## Develop and deploy

Run the adapter tests from the Open Inventory repository:

```sh
node --test tests/paperlesspaper-integration.test.mjs
node scripts/check-paperlesspaper-integration.mjs ../paperlesspaper-integrations
```

The browser check uses an isolated copy of the production integration server,
renders all three preview variants at four display sizes,
processes the smaller previews for Spectra 6, tests host updates and error states,
and exercises the settings page. It uses Chrome and the existing integrations
toolchain, writes previews to `screenshots/` and a report to
`output/paperlesspaper/check.json`.

Use the Paperlesspaper toolkit installed in the integrations repository to check
or preview this directory directly:

```sh
node ../paperlesspaper-integrations/node_modules/@paperlesspaper/openintegration/dist/cli.js check integrations/paperlesspaper/config.json
node ../paperlesspaper-integrations/node_modules/@paperlesspaper/openintegration/dist/cli.js dev integrations/paperlesspaper/config.json
```

Copy to the integration server checkout (this refuses to overwrite different
existing files unless `--replace` is given):

```sh
node scripts/sync-paperlesspaper-integration.mjs ../paperlesspaper-integrations
```

The provider automatically discovers the `open-inventory` folder. Deploy that
provider through its normal deployment process. The Open Inventory Next.js server
does not serve or execute this standalone integration directory.

The render and settings pages use the provider's standard `/assets/` runtime.
The bundled `assets/paperless.css`, `assets/paperless.iife.js` and Open Sans fonts
also let the toolkit preview this source folder independently. The two runtime
files are unmodified build outputs recorded in `assets/vendor.json`; update them
from the canonical `paperlesspaper-openintegration` build. Do not edit generated
bundles. The fonts retain their bundled license.
`lib/http.js` is a self-contained snapshot of the integrations repository's shared
`applications/_shared/dashboard-api.js` transport. The icon is the existing Open
Inventory SVG, rasterized to a transparent PNG.
