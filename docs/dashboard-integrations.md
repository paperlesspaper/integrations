# Daily-use dashboard integrations

Eleven integrations were added from the TRMNL / Home Assistant research, alongside
a seven-day daylight trend in the existing Day Calendar. The project color rules
are in [AGENTS.md](../AGENTS.md#color-on-spectra-6-displays).

| Integration | Connection | First-run behavior |
| --- | --- | --- |
| [Fuel Prices](../applications/fuel-prices/README.md) | Personal Tankerkönig API key | Labelled demo |
| [Seasonal Produce](../applications/seasonal-produce/README.md) | Local German harvest/storage guide | Current month |
| [School Timetable](../applications/school-timetable/README.md) | Manually entered weekly lessons | Labelled demo |
| [Mealie](../applications/mealie/README.md) | Instance URL + API token | Labelled demo |
| [RSS News](../applications/rss-news/README.md) | 1–4 public RSS/Atom URLs | Live Tagesschau feed |
| [Rocket Launches](../applications/rocket-launches/README.md) | Public Launch Library API | Live upcoming launches |
| [Austria Weather Warnings](../applications/austria-weather-warnings/README.md) | GeoSphere coordinates | Live Vienna municipality |
| [Umami Stats](../applications/umami-stats/README.md) | Cloud API key or self-hosted Bearer token | Labelled demo |
| [Home Assistant Sensors](../applications/home-assistant-sensors/README.md) | Instance URL, token, selected entities | Labelled demo |
| [Home Energy](../applications/home-energy/README.md) | Existing Home Assistant sensor mappings | Labelled demo |
| [E-Bike Status](../applications/ebike-status/README.md) | Existing Home Assistant sensor mappings | Labelled demo |

These are first versions. The per-integration READMEs describe supported fields,
limits and omitted optional features. API failures produce error states; they do
not silently replace live data with demonstrations. Data providers' content and
user-entered titles are preserved in their original language; fixed interface
copy follows the host's German or English language setting.

## Private services

The integration server, rather than the eInk frame, fetches upstream data. For
Home Assistant, Mealie or self-hosted Umami, run this provider on a trusted machine
that can reach the service, or provide a reachable HTTPS endpoint.

By default the new adapters require HTTPS and reject private, loopback,
link-local and reserved network addresses. A self-hosting operator can explicitly
enable exact private origins (scheme, host and port) using a server environment
variable, for example:

```sh
PAPERLESSPAPER_PRIVATE_API_ORIGINS=http://homeassistant.local:8123,http://mealie.local:9000
```

Set this in the server environment or local `.env` and restart the server. The
setting is not exposed to remote integration users. An enabled origin permits
HTTP if that exact HTTP origin is listed. Do not enable private origins on an
untrusted public multi-tenant deployment.

The transport pins validated DNS addresses to each request, bounds response
size and time, refuses credential-bearing redirects, and does not include
upstream URLs or response bodies in errors. Home Assistant adapters read only
the explicitly configured `sensor.*` and `binary_sensor.*` entities.

Tokens travel in same-origin JSON POST bodies from the renderer, then in Bearer
headers to Home Assistant, Mealie and Umami. Tankerkönig's documented upstream API
requires its key in the query string; the adapter never returns that URL to the
browser. Form password controls conceal input visually but are not a secret vault.

## Display and refresh behavior

- Supported target sizes: 800×480, 480×800, 1600×1200 and 1200×1600.
- Default designs use the six Spectra 6 colors with deliberate accents and a preference for orange over yellow. Text remains
  on high-contrast reading surfaces; status also has a written label.
- Configured screenshot variants are colored light and dark previews. The
  user's global color setting still selects the base theme.
- Lists show complete bounded entries, with a shown/total count when necessary.
- Fuel, launch and warning caches retain source retrieval timestamps. Sensor
  cards separately expose Home Assistant's entity timestamps. An unchanged
  entity timestamp does not necessarily mean a sensor is offline.
- Suggested refresh: fuel 10–15 minutes, warnings 5 minutes, RSS 15–30 minutes,
  launches 30–60 minutes, analytics 30 minutes. The host controls refresh frequency.
- Day Calendar's `season-daylight` chart shows seven daily deltas relative to
  today using SunCalc, including local-day and polar-condition handling.

## Validation

```sh
npm run check:dashboards
npm run check:dashboards -- --render
```

The first command validates all eleven manifests and runs the adapter regression
tests. The rendering option checks the two declared variants at four sizes,
generates 88 browser screenshots and writes a layout report to
`output/dashboard-integrations/layout-report.json`. It also checks a subsequent
host update for each integration, including English language, title and theme.
It requires Chrome; set
`CHROME_BIN` on platforms where Chrome is not at the default macOS location.
The test server uses port 3318, configurable with `PAPERLESSPAPER_TEST_PORT`.

Dashboard graphics use `spectra6OriginalPalette` with faithful error-diffusion
processing to approximate orange accents with the physical six-color palette.
Dark Umami/daylight charts use orange bars. Yellow is reserved for small accents
and the established level-one weather-warning meaning.

For production-like Spectra 6 processing, use the shared CLI without `--raw`:

```sh
npx paperless render applications/umami-stats/config.json \
  --viewport 800x480 --settings '{"sampleData":true}' \
  --output /tmp/umami-epd.png
```

Credentialed adapters are tested against controlled local HTTP fixtures, not
against a user's private accounts. A successful demo render does not establish
that a particular real account or hardware installation is connected.

See also [icon prompts](./integration-icon-prompts.md) and
[guideline feedback](./integration-guideline-feedback.md).
