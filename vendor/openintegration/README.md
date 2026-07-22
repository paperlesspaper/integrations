# @paperlesspaper/openintegration

Tiny helper toolkit and local CLI for static paperlesspaper OpenIntegration pages.

This package is intentionally boring: no React, no generated app lifecycle, and no `createRenderApp()`. Your integration stays a small website with a `config.json`, a `render.html`, and optionally an API route. The CLI provides the pieces needed to scaffold, validate, preview, and render those files locally.

## Install

```sh
npm install --save-dev @paperlesspaper/openintegration
```

After installing the package in your integration folder, npm can resolve the local `paperless` binary:

```sh
npx paperless dev
```

For a one-off run without installing it locally, point npx at the scoped package explicitly:

```sh
npx --package @paperlesspaper/openintegration paperless dev
```

Plain `npx paperless ...` only works with a local install. Otherwise npm tries the unrelated `paperless` package from the registry.

For no-build integrations, copy these files from `dist/` into your integration folder:

```txt
paperless.css
paperless.js
paperless.iife.js
```

## Dev preview

Create a starter integration:

```sh
paperless scaffold ./my-integration --name "My Integration"
```

Use `--no-api` for a static-only starter. By default the scaffold includes `api/data.js`, because most integrations need a small data adapter between external APIs and the render page.

Run a local paperlesspaper host simulator for an integration:

```sh
paperless dev
```

By default, `dev`, `check`, and `render` use `./config.json` when no path is provided.

During package development, you can run it from this repository:

```sh
npm run dev -- ../paperlesspaper-integrations/openintegrations/applications/quote/config.json
```

The preview serves the integration folder, validates `config.json`, opens a host page at `http://127.0.0.1:4300/__paperless/preview`, sends an `INIT` payload to the render iframe, generates sidebar inputs from `formSchema`, embeds `settingsPage` when configured, lets you edit raw `meta.pluginSettings`, caches preview values in `localStorage` with a reset button, and watches for `#website-has-loaded`.

The renderer panel can show either the raw Chrome/Puppeteer screenshot or the production-like `epdoptimize` output. Current sidebar settings and color are passed to the render page through the `INIT` payload; color is also mirrored into `meta.pluginSettings.color` automatically. Both render outputs replace the iframe in the main device preview, and Download saves the currently shown PNG.

Render pages can tune `epdoptimize` with a meta tag:

```html
<meta name="paperless:epd-optimize" content='{"intent":"vivid"}' />
```

Supported intents are `natural`, `vivid`, `readable`, `faithful`, and `lowNoise`. The page may update this tag before calling `markReady()`. Use `content='{"enabled":false}'` when a page wants the EPD render path to return the raw Puppeteer screenshot.

The content may also select a built-in `epdoptimize` palette export and override image/dither options:

```html
<meta
  name="paperless:epd-optimize"
  content='{"palette":"spectra6OriginalPalette","canvasDitherOptions":{"ditheringType":"quantizationOnly"}}'
/>
```

It also watches the integration folder and live-reloads the preview when files change. Disable that with:

```sh
paperless dev --no-watch
```

Validate an integration without opening the browser:

```sh
paperless check
```

Use `--json` for machine-readable check output in CI.

Render an integration through local Chrome/Puppeteer and `epdoptimize`:

```sh
paperless render --viewport 800x480 --output render.png
```

Use `--raw` to write the unoptimized Puppeteer screenshot. The interactive preview includes separate Puppeteer and EPD buttons that call the same local render endpoint, plus a Live button to switch the main preview back to the iframe.

The recommended generation loop is:

```sh
paperless scaffold ./applications/example --name "Example"
paperless check ./applications/example/config.json
paperless render ./applications/example/config.json --viewport 800x480 --output /tmp/example-landscape.png
paperless render ./applications/example/config.json --viewport 480x800 --output /tmp/example-portrait.png
paperless dev ./applications/example/config.json
```

## CLI development

The CLI entry point is `src/cli.ts` and is published as the `paperless` binary from `dist/cli.js`. The old `paperlesspaper-openintegration` binary remains available as an alias. Build it with:

```sh
npm run build
```

During package development, use `npm run dev -- <config.json>` to rebuild and run the local `dev` command in one step. To run another command against the freshly built CLI, call Node directly:

```sh
npm run build
node dist/cli.js check ../paperlesspaper-integrations/openintegrations/applications/quote/config.json
node dist/cli.js render ../paperlesspaper-integrations/openintegrations/applications/quote/config.json --viewport 800x480 --output /tmp/quote.png
```

The CLI is split across a few small modules:

- `src/cli.ts`: argument parsing, command dispatch, direct `render` output handling.
- `src/devServer.ts`: local host simulator, static file serving, `api/*.js` handlers, live reload, preview render endpoints.
- `src/devCheck.ts`: config, page, language, schema, and API handler validation.
- `src/scaffold.ts`: starter integration templates.
- `src/puppeteerRender.ts` and `src/epdOptimize.ts`: screenshot capture and production-like Spectra 6 optimization used by preview rendering.

`render` and the preview render buttons need a local Chrome executable. The resolver checks `--chrome-bin`, then `CHROME_BIN`, then `PUPPETEER_EXECUTABLE_PATH`, and on macOS falls back to `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.

The dev server exposes internal endpoints under `/__paperless/*`: `/__paperless/preview` for the host simulator, `/__paperless/render` for PNG rendering, `/__paperless/events` for live reload, `/__paperless/health` for probes, and `/__paperless/config-variants/regenerate` for screenshot variants declared in `config.json`.

Before publishing or changing CLI behavior, run:

```sh
npm run build
npm test
npm run typecheck
```

## LLM integration contract

When generating a new integration, create a small folder with this shape:

```txt
my-integration/
  config.json
  render.html
  languages/de.json # optional, when config.language includes "de"
  languages/en.json # optional, when config.language includes "en"
  api/data.js      # optional, but recommended for API/data normalization
  README.md        # optional
  assets/...       # optional static images or icons
```

Rules that keep generated integrations compatible:

- `config.json` must include `name`, `version`, and `renderPage`.
- Prefer `renderPage: "./render.html"` and relative asset/API paths.
- Add an `icon` path such as `"./assets/icon.png"` when the integration has a custom icon.
- Declare supported UI languages with `language: ["de", "en"]` and provide matching JSON object files at `languages/<code>.json`.
- Put every user-editable setting in both `nativeSettings` and `formSchema.properties`.
- Do not duplicate host language in `nativeSettings` or `formSchema`; render pages read it from `payload.meta.language`.
- Put global defaults such as `color` in `nativeSettings`, but do not add `color` to `formSchema.properties`; the host and CLI preview provide the global color control.
- If a setting is edited by a custom `settingsPage`, add `"inStettingsPage": true` to that `formSchema.properties.<name>` entry so the CLI preview does not also show it in the generated form.
- Use `""` for empty string settings instead of `null` when the setting is a text filter.
- Keep API handlers as default-exported async functions in `api/*.js`. The dev server calls them with `{ query, request }` and serves the returned value as JSON. `GET` query parameters remain supported; a same-origin `POST` with a JSON object merges that body into `query` (body values win, 64 KB limit). Prefer the JSON body for feed URLs, app passwords, client secrets, and other values that should not appear in request URLs.
- In `render.html`, put DOM updates in an async `renderPayload(payload)` function. Wait for the first `INIT` with `waitForPayload({ onUpdate: renderPayload })`, load copy with `loadLanguageJson(payload)` when localized text is used, merge defaults with `getSettings(payload)` and `getQuerySettings()`, render DOM, optionally set `<meta name="paperless:epd-optimize" content='{"intent":"readable"}' />`, wait for fonts/images if needed, fit content, then call `markReady()`. The `onUpdate` callback receives later preview `INIT` messages without reloading the iframe.
- Wrap the render logic in `try/catch` and call `markError(error)` on failure.
- Escape untrusted strings with `escapeHtml()` before injecting HTML.
- Add `<div id="website-has-loading-element"></div>` at startup. `markReady()` removes it and adds `#website-has-loaded`.
- Treat `color` as a global setting: include it in config and render defaults, merge it with `getSettings(payload)` and `getQuerySettings()`, then apply the resolved value with `applyColorTheme()` so host defaults and preview/query overrides all work.
- Do not repeat global body defaults in render pages. `paperless.css` already sets `html`/`body` sizing, overflow, `body { background: var(--pp-bg); color: var(--pp-fg); font-family: var(--pp-font); }`, and form-control font inheritance. Only override background, foreground, or font family locally when the integration intentionally needs a branded or mode-specific design.
- Use theme variables from the element that receives the theme class. `applyColorTheme()` applies classes to `document.body` by default, so generated CSS should use `--pp-bg`, `--pp-fg`, `--pp-muted`, `--pp-border`, `--pp-card`, and `--pp-accent` directly in component rules. Do not alias these variables on `:root`, because those aliases can resolve before the `body` theme class takes effect.
- Design for fixed color eInk frames. paperlesspaper displays support the six Spectra 6 colors, so do not assume monochrome-only rendering.
- Prefer high-contrast layouts, intentional color accents, real CSS media queries for orientation, and deterministic data limits so text cannot grow without bound.

Minimal render flow for generated pages:

```js
const defaults = {
  // Add integration-specific defaults here too.
  color: "light"
};

async function renderPayload(payload) {
  markLoading();
  const { messages } = await loadLanguageJson(payload);
  const settings = mergeSettings(defaults, getSettings(payload), getQuerySettings());
  applyColorTheme(settings.color, { defaultTheme: defaults.color });

  // Fetch/prepare data, update the DOM, then:
  await document.fonts?.ready;
  fitAllText();
  fitToScreen(document.querySelector("#app"));
  markReady();
}

const payload = await waitForPayload({ timeoutMs: 500, onUpdate: renderPayload });
await renderPayload(payload);
```

## Integration icons

Icons are shown in the integration list, settings, and the local preview chrome. Use a square PNG with a transparent background; `1024x1024` is recommended. Store it with the integration, for example at `assets/icon.png`, and reference it from `config.json`:

```json
{
  "icon": "./assets/icon.png"
}
```

Keep the icon shape simple, centered, and readable at small sizes. Avoid text, shadows outside the icon, and busy backgrounds. The current icon guide is available at <https://docs.paperlesspaper.de/open-integration/icons>.

Prompt template for generated icons:

```txt
A high-resolution 2D digital icon for an integration for the paperlesspaper eInk display that can YOUR USECASE, featuring slightly 3D shading and highlights to give it depth.

The icon has smooth, beveled edges and appears realistic but minimalistic. The image is viewed from the top. The background is fully transparent, with no shadows or surrounding elements, suitable for use as an icon or in UI design.
```

## Language JSON

An integration can advertise supported languages in `config.json`:

```json
{
  "language": ["de", "en", "fr", "es", "it"]
}
```

For each declared code, add a JSON object at `languages/<code>.json`:

```json
{
  "title": "Daily XKCD",
  "footerPrefix": "Alt text"
}
```

The host-selected language is delivered as `payload.meta.language`. The CLI preview and render command accept `--language <code>`; the preview also shows a language selector when `config.language` is present. If no language is provided, the first declared language is used. Integrations without `config.language` keep the legacy `"de"` default.

Use `loadLanguageJson(payload)` in `render.html`. It resolves exact language codes first, then base codes such as `de-DE -> de`, then the default language, and fetches `languages/<resolved>.json`. `paperless check` verifies that every declared language file exists, parses as JSON, and contains an object.

Set the optional top-level `timezone` field to an IANA timezone such as `Europe/Berlin` when the render page should observe a specific local time. Puppeteer applies it before loading the render page; when omitted, the renderer keeps its system timezone.

## Minimal config.json

```json
{
  "name": "daily-xkcd",
  "version": "1.0.0",
  "description": "Show an XKCD comic on a paperlesspaper display.",
  "timezone": "Europe/Berlin",
  "renderPage": "render.html",
  "language": ["de", "en"],
  "nativeSettings": {
    "color": "light",
    "kind": "latest",
    "difference": 0
  },
  "formSchema": {
    "type": "object",
    "properties": {
      "kind": {
        "type": "string",
        "enum": ["latest", "random"]
      },
      "difference": {
        "type": "number"
      }
    }
  }
}
```

Generated settings forms support the standard JSON Schema primitive `type` values `string`, `number`,
`integer`, `boolean`, `array`, and `object`. Strings can opt into richer inputs with `format`: use
`date`, `time`, `date-time`/`datetime-local`, `email`, `uri`/`url`, `password`, `color`, `tel`,
`month`, `week`, or `textarea`. Number inputs honor `minimum`, `maximum`, and `step`; string inputs honor
`minLength`, `maxLength`, `pattern`, and `placeholder`.

## Static render.html

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="paperless:epd-optimize" content='{"intent":"readable"}' />
    <title>Daily XKCD</title>
    <link rel="stylesheet" href="./paperless.css" />
  </head>
  <body>
    <div id="website-has-loading-element"></div>

    <main id="app" class="pp-screen">
      <p>Loading...</p>
    </main>

    <script type="module">
      import {
        waitForPayload,
        getSettings,
        getQuerySettings,
        mergeSettings,
        loadLanguageJson,
        applyColorTheme,
        markLoading,
        markReady,
        markError,
        fitAllText,
        fitToScreen,
        escapeHtml
      } from "./paperless.js";

      const app = document.querySelector("#app");

      async function renderPayload(payload) {
        try {
          markLoading();
          const { messages } = await loadLanguageJson(payload);
          const defaults = { color: "light", kind: "latest", difference: 0 };
          const settings = mergeSettings(
            defaults,
            getSettings(payload),
            getQuerySettings()
          );
          applyColorTheme(settings.color, { defaultTheme: defaults.color });

          const response = await fetch(new URL("./api/data", window.location.href), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: settings.kind, difference: settings.difference })
          });
          const comic = await response.json();
          const footerPrefix = typeof messages.footerPrefix === "string"
            ? messages.footerPrefix
            : "";

          app.innerHTML = `
          <section class="pp-header">
            <div>
              <h1 class="pp-title pp-fit">${escapeHtml(comic.title)}</h1>
              <p class="pp-subtitle">xkcd #${escapeHtml(comic.num)}</p>
            </div>
          </section>

          <section class="pp-image-frame" style="flex: 1">
            <img src="${escapeHtml(comic.img)}" alt="${escapeHtml(comic.alt)}" />
          </section>

          <footer class="pp-footer">${escapeHtml(footerPrefix ? `${footerPrefix}: ${comic.alt}` : comic.alt)}</footer>
        `;

          await document.fonts?.ready;
          fitAllText();
          fitToScreen(app);
          markReady();
        } catch (error) {
          markError(error);
        }
      }

      const payload = await waitForPayload({ timeoutMs: 500, onUpdate: renderPayload });
      await renderPayload(payload);
    </script>
  </body>
</html>
```

## IIFE usage

```html
<script src="./paperless.iife.js"></script>
<script>
  const { markReady, markError } = window.PaperlessOpenIntegration;
</script>
```

## Helpers

- `markLoading()`
- `markReady()`
- `markError(error?)`
- `waitForPayload({ timeoutMs?, fallback?, allowedOrigins?, onUpdate? })`
- `getSettings(payload?, defaults?)`
- `getQuerySettings(defaults?)`
- `mergeSettings(...sources)`
- `getPayloadLanguage(payload?)`
- `resolveLanguage({ requested?, supported?, defaultLanguage? })`
- `loadLanguageJson(payload?, { supported?, defaultLanguage?, basePath?, fetch? })`
- `applyColorTheme(value?, { defaultTheme?, target? })`
- `applyColorThemeFromQuery({ paramName?, defaultTheme?, target? })`
- `fitText(element, options?)`
- `fitAllText(selector?, options?)`
- `hyphenateText(value, options?)`
- `addSoftHyphensToTextNodes(root, options?)`
- `prepareHyphenation(element, options?)`
- `fitHyphenatedText(element, options?)`
- `fitToScreen(element?, options?)`
- `detectOverflow(root?)`
- `fitImage(image, mode?)`
- `escapeHtml(value)`
- `normalizeCalendarSettings(settings?, defaults?)`
- `buildCalendarRange(settings?, now?)`
- `prepareCalendarEvents(events, settings?, now?)`
- `renderCalendarLayout(options?)`
- `fitCalendarLayout(layout, options?)`
- `waitForCalendarImages(layout, timeoutMs?)`
- `bootCalendarApiIntegration(options)`
- `validateConfig(config)`

## Shared calendar layouts

Calendar integrations should keep authentication, API requests, recurrence expansion, and
provider-specific field parsing in a small adapter. The adapter maps every result to the shared
event shape and hands it to `renderCalendarLayout()`. The runtime owns date ranges, timezone-safe
grouping, sorting, empty states, all five views, optional locations/icons/images, responsive CSS,
and fitting.

```js
const settings = normalizeCalendarSettings({
  ...getSettings(payload),
  ...getQuerySettings()
});

const events = providerEvents.map((event) => ({
  id: event.id,
  title: event.subject,
  start: {
    date: event.allDayDate, // YYYY-MM-DD; use either date or dateTime
    dateTime: event.startDateTime, // ISO 8601, ideally with an offset
    timeZone: event.timeZone
  },
  end: {
    date: event.allDayEndDate,
    dateTime: event.endDateTime,
    timeZone: event.timeZone
  },
  location: event.location,
  iconName: event.iconName,
  imageUrl: event.imageUrl,
  details: [{ label: "Role", value: event.role }]
}));

const layout = renderCalendarLayout({
  target: "#app",
  events,
  settings,
  messages,
  header: { title: "Calendar", source: "Provider name" }
});

await document.fonts?.ready;
await waitForCalendarImages(layout);
fitCalendarLayout(layout);
```

The canonical views are `agenda`, `day`, `three-days`, `week`, and `year`. Common settings are
`locale`, `timeZone`, `dayRange`, `maxEvents`, `highlightToday`, `highlightScale`, `showLocation`,
`showEventIcons`, and `showEventImages`. For compatibility, normalization also accepts `language`
as an alias for `locale`, `daysAhead` for `dayRange`, and common three-day view spellings.

Use `start.date` for all-day values to preserve the provider's civil date without a UTC shift.
Use an ISO value in `start.dateTime` for timed events and include the provider timezone when it is
known. The configured `timeZone` is authoritative for timed-event grouping and clock display; an
event timezone is only a fallback when no display timezone is configured. Events with an exclusive
`end.date` or an `end.dateTime` are repeated on every visible civil day they overlap. Treat
`maxEvents` as a presentation limit and keep a separate, bounded adapter fetch/parse limit so week
and year views receive the complete requested range. Do not pass provider HTML to the shared renderer: it escapes all displayed fields, while the
adapter remains responsible for extracting and validating any image URL or icon metadata.

Server adapters that receive iCalendar data can import the recurrence-aware parser from the
server-only subpath (it is intentionally excluded from `paperless.iife.js`):

```js
import { parseICalendar } from "@paperlesspaper/openintegration/ical";

const events = parseICalendar(icsText, {
  rangeStart: "2026-07-22",
  rangeEndExclusive: "2026-08-05",
  timeZone: "Europe/Berlin"
});
```

The parser returns the same canonical `CalendarEvent[]` shape. It supports date-only and timed
values, floating and bundled timezone definitions, `DTEND`/duration, recurrence rules and dates,
exclusions, moved or cancelled exceptions, and bounded expansion. Use its event and occurrence
limits together with adapter-level request timeouts and response-size limits.

Canonical API-backed calendars can reduce their render page to a defaults object and one boot call:

```js
window.__paperlessRenderDone = bootCalendarApiIntegration({
  defaults: {
    color: "light",
    title: "My Calendar",
    view: "agenda",
    locale: "en-US",
    timeZone: "Europe/Berlin",
    dayRange: 14,
    maxEvents: 12,
    showHeader: true,
    showLocation: true
  }
});
```

The API returns `{ events, calendarName?, source?, sample? }` using the canonical event shape.
The helper sends settings to the same-origin `./api/data` route as a JSON POST body, keeping feed
URLs and app passwords out of request URLs. It also owns payload updates, localization, theme,
the five shared views, font/image settling, fitting, and ready/error markers. Use `mapEvents`,
`buildRequest`, or `resolveHeader` only when a provider needs a thin adapter around that contract.

## Color themes

`paperless.css` exposes app-style theme class names using only the six full Spectra 6 device colors internally:

```txt
dark, light, red-dark, red-light, blue-dark, blue-light, green-dark, green-light
```

Generated render pages should treat `color` as a global setting with a local default, merge it from the host payload and query string, then call `applyColorTheme(settings.color, { defaultTheme: defaults.color })`. For query-only static pages, `applyColorThemeFromQuery()` is a shortcut that reads `?color=` and applies the theme to `document.body`. The CSS exposes both the openintegration variables (`--pp-bg`, `--pp-fg`, `--pp-muted`, `--pp-border`, `--pp-card`, `--pp-accent`) and the app-style aliases (`--background`, `--foreground`, `--muted`, `--card-border`, `--accent`).

Because the theme class is applied to `body`, custom CSS should consume those variables directly in rules under the themed element, for example `background: var(--pp-bg)` and `color: var(--pp-fg)`. Avoid creating theme-dependent aliases on `:root`, such as `--panel-bg: var(--pp-bg)`, then using `var(--panel-bg)` inside the app. Root aliases are resolved from the root scope and can keep the default colors even after the body theme changes. If an alias is useful for readability, define it on the themed component, such as `.my-screen { --panel-bg: var(--pp-bg); }`.

The base stylesheet already applies the resolved theme to the page chrome with `body { background: var(--pp-bg); color: var(--pp-fg); font-family: var(--pp-font); }`, plus matching `html` sizing/background and inherited fonts for form controls. Render pages should not restate those defaults on `body` or the top-level screen. Local background, color, and font declarations are reserved for deliberate overrides, such as a photo viewer with a fixed black canvas or a branded editorial layout.

## Plain CSS orientation

The upstream `mixins.scss` is just direct orientation media queries. In plain CSS, write the wrapped styles explicitly:

```css
@media (orientation: portrait) {
  /* equivalent to @include horizontal */
}

@media (orientation: landscape) {
  /* equivalent to @include vertical */
}
```
