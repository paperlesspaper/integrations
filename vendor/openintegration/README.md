# @paperlesspaper/openintegration

Tiny helper toolkit for static paperlesspaper OpenIntegration pages.

This package is intentionally boring: no React, no CLI, no generated app lifecycle, and no `createRenderApp()`. Your integration stays a small website with a `config.json`, a `render.html`, and optionally an API route.

## Install

```sh
npm install @paperlesspaper/openintegration
```

For no-build integrations, copy these files from `dist/` into your integration folder:

```txt
paperless.css
paperless.js
paperless.iife.js
```

## Minimal config.json

```json
{
  "name": "daily-xkcd",
  "version": "1.0.0",
  "description": "Show an XKCD comic on a paperlesspaper display.",
  "renderPage": "render.html",
  "nativeSettings": {
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

## Static render.html

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
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
        markReady,
        markError,
        fitAllText,
        fitToScreen,
        escapeHtml
      } from "./paperless.js";

      const app = document.querySelector("#app");

      try {
        const payload = await waitForPayload({ timeoutMs: 500 });
        const settings = mergeSettings(
          { kind: "latest", difference: 0 },
          getSettings(payload),
          getQuerySettings()
        );

        const url = new URL("./api/data.js", window.location.href);
        url.searchParams.set("kind", settings.kind);
        url.searchParams.set("difference", settings.difference);

        const response = await fetch(url);
        const comic = await response.json();

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

          <footer class="pp-footer">${escapeHtml(comic.alt)}</footer>
        `;

        await document.fonts?.ready;
        fitAllText();
        fitToScreen(app);
        markReady();
      } catch (error) {
        markError(error);
      }
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
- `waitForPayload({ timeoutMs?, fallback?, allowedOrigins? })`
- `getSettings(payload?, defaults?)`
- `getQuerySettings(defaults?)`
- `mergeSettings(...sources)`
- `fitText(element, options?)`
- `fitAllText(selector?, options?)`
- `fitToScreen(element?, options?)`
- `detectOverflow(root?)`
- `fitImage(image, mode?)`
- `escapeHtml(value)`
- `validateConfig(config)`
