# Integration icon prompts

## SBB Abfahrten — 2026-10-06

Generated with the built-in Imagegen tool following the shared icon guide.
The red-and-white Swiss train has subtle dimensional shading and a transparent
background. The original 1254×1254 RGBA PNG was copied unchanged into
`applications/sbb-abfahrten/assets/icon.png`, replacing the vector-derived icon.
The complete prompt, source path, checksum and alpha validation are recorded in
[`sbb-icon-generation.json`](./sbb-icon-generation.json).

## Connected integrations — 2026-10-03

The 18 icons for Bring!, plant care, EVCC, TeslaMate, Notion, Microsoft To Do,
Trello, GitHub Reviews & CI, GitHub Activity, UniFi, tides, snow report, aurora,
eBird, station accessibility, WooCommerce, Shopify and YouTube Analytics were
generated individually with the built-in **Image Gen** tool. Each original
1254×1254 RGBA PNG is saved unchanged at its integration's `assets/icon.png`.
The previous vector icon files and their generator were removed.

The complete prompts, source filenames, saved paths and checksums are in
[`connected-icon-generation.json`](./connected-icon-generation.json).
`node scripts/check-connected-icons.mjs` validates the assets and builds the
local gallery at `output/connected-integrations/icons.html`.

## Calendar and Nextcloud icon refresh — 2026-09-26

The prompts for Proton Calendar, Apple Calendar, Outlook Calendar, Nextcloud
Photos, Nextcloud Calendar, Webcal & iCalendar, and CalDAV are recorded in
[`calendar-icon-generation.json`](./calendar-icon-generation.json).

Each icon was generated separately with the built-in Imagegen tool, using the
shared openintegration icon guide. The original 1254×1254 RGBA PNGs were copied
unchanged into each integration's `assets/icon.png`, preserving genuine alpha
transparency. The manifests already reference these PNGs. Legacy SVGs are
independent illustrations, not source files for the generated PNGs.

The existing Payload media records were updated for both hero and SEO references.
Frontend filenames include `-20260926` to avoid stale image caches. All seven public
integration pages were checked after revalidation and reference the new files.
The media CDN serves transparent 1254×1254 WebP derivatives of the uploaded PNGs.

## traffic-sign-of-the-day

Saved asset: `applications/traffic-sign-of-the-day/assets/icon.png`

Generated and edited with the built-in **Image Gen** tool. The final icon is a
single German yield sign with a short silver post, without a book or lettering.
It uses genuine PNG alpha transparency and was copied without postprocessing.
The manifest, repository README and integration README all use this asset.
The separately sourced traffic-sign SVGs on the learning cards are unchanged.

Final edit prompt:

```text
Use case: precise-object-edit. Simplify the provided integration icon: completely remove the open book and its blue cover, pages, base and every trace of it. Keep only the same red and white downward-pointing German yield sign and a short, neatly finished silver-gray post beneath it. Preserve the sign's shape, plain opaque white center, red bevelled border and subtle highlights. Center the resulting sign-and-short-post silhouette in a square canvas with balanced transparent padding. No base, pedestal, books, learning objects, extra symbols, text, shadows or floating flecks. Clean genuinely transparent alpha background; keep the white sign center opaque. Entire subject visible, crisp and readable at small app-icon sizes. Square PNG, preferably 1024x1024.
```

## bambu-lab

Saved asset: `applications/bambu-lab/assets/icon.png`

Generated with the built-in Imagegen tool on 2026-09-22. The selected PNG is copied into the integration without raster postprocessing, preserving its transparent alpha background. It depicts a generic enclosed 3D printer with a green printed vase and blue status strip; it is not an official Bambu Lab logo. The lightweight line icon in the eInk header remains a separate inline SVG.

Prompt:

Use case: stylized-concept. Create a single application integration icon for paperlesspaper: Bambu Lab cloud 3D print monitoring. Subject: one compact enclosed desktop 3D printer, front three-quarter view, matte white and charcoal enclosure, visible green printed spiral vase on the print bed and a simple print head above it. Style: polished minimal high-resolution 2D digital icon with restrained 3D bevels and highlights, matching a collection of realistic but minimal app icons. Strong recognizable silhouette that works at 48px. Centered isolated object, square 1024x1024 canvas with generous padding, the whole object visible. Truly transparent alpha background, no floor, no surrounding objects, no cast shadow outside the object. Blue accent on a small status strip, green vase. No text, no letters, no numbers, no logo, no watermark, no painted checkerboard.

## air-quality

Saved asset: `applications/air-quality/assets/icon.png`

Create one integration icon: a white cloud with three blue flowing air lines and one green leaf. Square 1024x1024 PNG, centered single coherent object with generous padding. Minimalistic high-resolution 2D illustration with subtle 3D beveled edges and gentle highlights matching existing paperlesspaper icons. Transparent alpha background, no painted checkerboard, no outside shadows, no text, no watermark. Prefer blue, green and orange; no yellow.

Postprocessing: user-authorized Python (rembg/U2Net and Pillow), transparent 1024×1024 RGBA PNG.

## river-levels

Saved asset: `applications/river-levels/assets/icon.png`

Create one integration icon: a blue water wave around a white vertical water-level gauge with orange markers, no digits. Square 1024x1024 PNG, centered single coherent object with generous padding. Minimalistic high-resolution 2D illustration with subtle 3D beveled edges and gentle highlights matching existing paperlesspaper icons. Transparent alpha background, no painted checkerboard, no outside shadows, no text, no watermark. Prefer blue, green and orange; no yellow.

Postprocessing: user-authorized Python (rembg/U2Net and Pillow), transparent 1024×1024 RGBA PNG. A localized inner-wave mask removes remaining checkerboard pixels.

## github-releases

Saved asset: `applications/github-releases/assets/icon.png`

Create one integration icon: a blue software package box with an orange upward arrow and small green release tag, no logos. Square 1024x1024 PNG, centered single coherent object with generous padding. Minimalistic high-resolution 2D illustration with subtle 3D beveled edges and gentle highlights matching existing paperlesspaper icons. Transparent alpha background, no painted checkerboard, no outside shadows, no text, no watermark. Prefer blue, green and orange; no yellow.

Postprocessing: user-authorized Python (rembg/U2Net and Pillow), transparent 1024×1024 RGBA PNG.

## paperless-ngx-inbox

Saved asset: `applications/paperless-ngx-inbox/assets/icon.png`

Create one integration icon: a green inbox tray holding two white document sheets with abstract blue lines. Square 1024x1024 PNG, centered single coherent object with generous padding. Minimalistic high-resolution 2D illustration with subtle 3D beveled edges and gentle highlights matching existing paperlesspaper icons. Transparent alpha background, no painted checkerboard, no outside shadows, no text, no watermark. Prefer blue, green and orange; no yellow.

Postprocessing: user-authorized Python (rembg/U2Net and Pillow), transparent 1024×1024 RGBA PNG.


Generated with the built-in Imagegen tool. Each icon was requested separately.

The initial outputs painted a checkerboard instead of encoding transparency.
With the user's explicit approval, Python postprocessing removed backgrounds
using `rembg` / U2Net and Pillow, then resized each asset to 1024×1024 RGBA PNG.
The bicycle additionally received a localized cleanup between its spokes and
inside its frame. Final files were checked for transparent borders and viewed
against light and dark backgrounds. No image-processing dependency is required
to run these integrations.

## fuel-prices

Saved asset: `applications/fuel-prices/assets/icon.png`

Use case: stylized-concept. Create a 1024x1024 PNG integration icon for a paperlesspaper eInk display showing fuel prices: one simple red petrol pump with a black hose. High-resolution 2D digital icon with subtle 3D shading, smooth beveled edges and highlights, realistic but minimalistic. Centered, fully visible, viewed from the top/front, generous padding. Fully transparent alpha background, no cast shadows, no surroundings, no text, no numbers, no watermark.

## seasonal-produce

Saved asset: `applications/seasonal-produce/assets/icon.png`

Use case: stylized-concept. Asset: a single square PNG icon for a paperlesspaper eInk integration. Subject: a ripe red apple and a green broccoli floret. High-resolution 2D digital icon, slightly 3D shading and highlights, smooth beveled edges, realistic but minimalistic, viewed from the top/front. Centered, fully visible with generous padding. Fully transparent alpha background, no shadows outside the object, no surrounding elements, no text, no numbers, no logos or watermark. 1024x1024.

## school-timetable

Saved asset: `applications/school-timetable/assets/icon.png`

Use case: stylized-concept. Asset: a single square PNG icon for a paperlesspaper eInk integration. Subject: a blue school timetable board with colored empty lesson blocks and a yellow pencil. High-resolution 2D digital icon, slightly 3D shading and highlights, smooth beveled edges, realistic but minimalistic, viewed from the top/front. Centered, fully visible with generous padding. Fully transparent alpha background, no shadows outside the object, no surrounding elements, no text, no numbers, no logos or watermark. 1024x1024.

## mealie

Saved asset: `applications/mealie/assets/icon.png`

Use case: stylized-concept. Asset: a single square PNG icon for a paperlesspaper eInk integration. Subject: a white dinner plate with a fork, green leaf and red tomato. High-resolution 2D digital icon, slightly 3D shading and highlights, smooth beveled edges, realistic but minimalistic, viewed from the top/front. Centered, fully visible with generous padding. Fully transparent alpha background, no shadows outside the object, no surrounding elements, no text, no numbers, no logos or watermark. 1024x1024.

## rss-news

Saved asset: `applications/rss-news/assets/icon.png`

Use case: stylized-concept. Asset: a single square PNG icon for a paperlesspaper eInk integration. Subject: an orange RSS symbol on a small white newspaper card with abstract lines. High-resolution 2D digital icon, slightly 3D shading and highlights, smooth beveled edges, realistic but minimalistic, viewed from the top/front. Centered, fully visible with generous padding. Fully transparent alpha background, no shadows outside the object, no surrounding elements, no text, no numbers, no logos or watermark. 1024x1024.

## rocket-launches

Saved asset: `applications/rocket-launches/assets/icon.png`

Use case: stylized-concept. Asset: a single square PNG icon for a paperlesspaper eInk integration. Subject: a white and red space rocket with small blue fins. High-resolution 2D digital icon, slightly 3D shading and highlights, smooth beveled edges, realistic but minimalistic, viewed from the top/front. Centered, fully visible with generous padding. Fully transparent alpha background, no shadows outside the object, no surrounding elements, no text, no numbers, no logos or watermark. 1024x1024.

## umami-stats

Saved asset: `applications/umami-stats/assets/icon.png`

Use case: stylized-concept. Asset: a single square PNG icon for a paperlesspaper eInk integration. Subject: a blue bar chart with three ascending bars and a small green trend arrow. High-resolution 2D digital icon, slightly 3D shading and highlights, smooth beveled edges, realistic but minimalistic, viewed from the top/front. Centered, fully visible with generous padding. Fully transparent alpha background, no shadows outside the object, no surrounding elements, no text, no numbers, no logos or watermark. 1024x1024.

## austria-weather-warnings

Saved asset: `applications/austria-weather-warnings/assets/icon.png`

Use case: stylized-concept. Asset: a single square PNG icon for a paperlesspaper eInk integration. Subject: a white storm cloud with a yellow lightning bolt and a red warning triangle. High-resolution 2D digital icon, slightly 3D shading and highlights, smooth beveled edges, realistic but minimalistic, viewed from the top/front. Centered, fully visible with generous padding. Fully transparent alpha background, no shadows outside the object, no surrounding elements, no text, no numbers, no logos or watermark. 1024x1024.

## home-assistant-sensors

Saved asset: `applications/home-assistant-sensors/assets/icon.png`

Use case: stylized-concept. Asset: a single square PNG icon for a paperlesspaper eInk integration. Subject: a blue house silhouette with a small thermometer and green sensor dot. High-resolution 2D digital icon, slightly 3D shading and highlights, smooth beveled edges, realistic but minimalistic, viewed from the top/front. Centered, fully visible with generous padding. Fully transparent alpha background, no shadows outside the object, no surrounding elements, no text, no numbers, no logos or watermark. 1024x1024.

## home-energy

Saved asset: `applications/home-energy/assets/icon.png`

Use case: stylized-concept. Asset: a single square PNG icon for a paperlesspaper eInk integration. Subject: a blue solar panel and a small green battery with a yellow lightning bolt. High-resolution 2D digital icon, slightly 3D shading and highlights, smooth beveled edges, realistic but minimalistic, viewed from the top/front. Centered, fully visible with generous padding. Fully transparent alpha background, no shadows outside the object, no surrounding elements, no text, no numbers, no logos or watermark. 1024x1024.

## ebike-status

Saved asset: `applications/ebike-status/assets/icon.png`

Use case: stylized-concept. Asset: a single square PNG icon for a paperlesspaper eInk integration. Subject: a green bicycle with a small battery symbol. High-resolution 2D digital icon, slightly 3D shading and highlights, smooth beveled edges, realistic but minimalistic, viewed from the top/front. Centered, fully visible with generous padding. Fully transparent alpha background, no shadows outside the object, no surrounding elements, no text, no numbers, no logos or watermark. 1024x1024.

## Parcel, Readwise and Upcoming Movies

Generated PNG icons and their exact prompts: [generation provenance](./parcel-readwise-movies-icon-prompts.md). A visual index of all three icons and 24 eInk screenshots is available in the [asset gallery](./parcel-readwise-movies-assets.md).
