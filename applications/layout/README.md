# Layout

First-party host integration for two to four existing papers. Select **Layout** in the app;
choose contents and processing per slot. The host resolves paper IDs within the current
organization and sends `{ layout: { renderId, regions, layout, ratio, gap, html, css, color } }`.
Do not install this as an ordinary plugin: it requires the host's content resolver.

Each resolved region has `id`, `type` (`image` or `integration`), `url`, optional `payload`,
`processing` (`inherit`, `photo`, `readable`, `quantization`), and image `fit`, `focalX`, `focalY`.
URLs/data are ephemeral and must not be stored in settings. Images use undithered sources.

Custom HTML uses `<paperless-slot name="left"></paperless-slot>` with one slot for every
configured name. HTML is presentation-only; scripts, event handlers, resource-loading CSS,
links and arbitrary embedded content are rejected. CSS is isolated in a shadow root.
Slots must be opaque, rectangular, non-overlapping and inside the viewport. Masks,
transforms, rounded corners and nested layouts are not supported. Configure every slot's
size explicitly with Grid/Flexbox or CSS dimensions; no CSS transforms for sizing.

```html
<div class="dashboard">
  <paperless-slot name="left"></paperless-slot>
  <paperless-slot name="right"></paperless-slot>
</div>
```

```css
.dashboard { display:grid; width:100%; height:100%; grid-template-columns:2fr 1fr; gap:12px; }
@media (orientation:portrait) {
  .dashboard { grid-template-columns:1fr; grid-template-rows:2fr 1fr; }
}
```

The runtime waits for images to decode and integrations to finish INIT rendering. Every
render creates fresh child documents. Any required child error/timeout fails the whole
render and keeps the previous device image. Updated Open Integration runtimes support the
embedded handshake in live previews; the server renderer also bridges legacy readiness
markers. Integrations without a readiness contract or which prohibit framing cannot be
embedded. Data refresh follows the device's existing update interval; photos stay fixed.

Deploy the host API/renderer and updated shared runtime with this integration. Set
`LAYOUT_RENDER_URL` on the API and `REACT_APP_LAYOUT_RENDER_URL` on the web app for local
or staging providers; defaults point at the production integration URL.

## Shared runtime snapshot

`vendor/layout-runtime` is built from the canonical `openintegration` layout branch.
The asset copy script appends its `dist/layout-addon.iife.js` to the existing shared
browser runtime, retaining the provider's calendar and other integration exports.
The addon updates public lifecycle helpers and bridges older embedded readiness markers.
To update it, build/test/typecheck the SDK, copy package.json, README.md and dist into
this snapshot, then run `npm install` here. Do not edit generated bundles directly.
