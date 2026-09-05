# Illustrated of-the-day integrations

Use one shared renderer for tree, train, bird, spacecraft, fish, dinosaur, and comparable
illustrated daily cards. Each integration owns only its catalog, item selection, settings,
localized copy and fact order. Do not migrate `country-of-the-day`, whose map and country
information use a different composition, using this guide.

Load `/assets/paperless.css` and `/assets/paperless.iife.js` from the host. Do not add a second
copy of the card CSS to an integration. The canonical implementation is `src/ofTheDay.ts`
and the `.pp-otd-*` section in `src/styles/paperless.css`.

## Required settings and copy

Declare `textSize: "middle"` and `showHeader: true` in nativeSettings, every config variant,
and formSchema. `textSize` accepts `small`, `middle`, and `big`. Its effect applies to title,
subtitle, description, fact labels and values. Larger text may display fewer facts.

`showHeader: false` hides the title, kicker, date, subtitle, description, source and other
metadata. Declare `showFactCount: false` and `showRotationCount: false` in nativeSettings,
every config variant and formSchema. These independent opt-in switches show the number of
facts displayed and the number of catalog items in rotation respectively. The fact count
only appears when selected facts do not all fit, and is independent of showHeader. Rotation
metadata requires showHeader. If every fact setting is false, render zero facts; never restore a
fallback selection. Header off plus zero facts is an image-only view.

Add a localized `factsShown` message in every supported UI language:

```json
{ "factsShown": "{shown} of {total} facts" }
```

Pass the template unchanged to the renderer. If the integration's `t()` function substitutes
placeholders eagerly, preserve both placeholders as in the example below.

## Render lifecycle

```js
const layout = renderOfTheDayLayout({
  target: "#app",
  layout: "auto",
  textSize: settings.textSize,
  showHeader: settings.showHeader !== false,
  showFactCount: settings.showFactCount === true,
  factsShown: t("factsShown", { shown: "{shown}", total: "{total}" }),
  kicker: t("kicker"),
  title: item.name,
  subtitle: item.nickname,
  signature: item.signature,
  image: { src: item.image, alt: item.name, blendMode: "multiply" },
  meta: [
    { key: "date", value: formatDate(today) },
    { key: "source", value: item.source },
    { key: "rotation", value: t("selectedFrom", { count: poolSize }), visible: settings.showRotationCount === true }
  ],
  facts: availableFacts.map(fact => ({
    label: fact.label,
    value: fact.value,
    visible: settings[fact.setting] !== false
  }))
});
await Promise.all([document.fonts?.ready, waitForOfTheDayImage(layout)]);
const report = fitOfTheDayLayout(layout, { textSize: settings.textSize });
markReady();
```

Keep the existing INIT/onUpdate, localization, query-setting merge, applyColorTheme,
loading/error handling and deterministic item selection. The shared helper escapes content.
It waits for image decoding, including cached images, and rejects images that already failed.
Call fitting only after fonts and the image are ready. Repeated renders replace the old
layout state; window resize and orientation changes refit the current content.

## Layout and image contract

`layout: "auto"` selects the composition after the image loads. A source aspect ratio below
1.25 uses a side-by-side layout in landscape: approximately 42% text and 58% image. Wider
images use the full width below a compact header, with identity and description sharing a
row. Portrait stacks header, image, facts and metadata.

Legacy explicit modes remain supported: `facts-left-landscape` forces the side layout in
landscape; `default` forces the stacked layout. Use these only when source whitespace makes
its aspect ratio a misleading description of the subject. Neither mode changes portrait.
The old train-only `pp-otd--image-full-width` exception is no longer needed.

The image occupies a positioned, explicitly bounded container. `contain` is the default;
the actual image element must never exceed that container. Do not use negative translations,
scaling or `overflow: hidden` to repair composition. A fitted image box does not fix a subject
already cut off in the source file.

Create source illustrations with the entire intended subject or vehicle segment visible,
a clear silhouette and a small safe margin. Review subject occupancy as well as file aspect
ratio: excessive white space makes the illustration smaller. Prefer simple, well-separated
color regions over details that dissolve into dithering. Dedicated portrait/landscape assets
may be appropriate for extremely wide vehicles; never stretch the image to fill the space.
Illustrations intentionally sit on a white image stage; surrounding text and borders follow
the current six-color theme, including dark modes.

## Typography and content budgets

The scale is the smaller of width/800 and height/480 in landscape, and width/480 and
height/800 in portrait. Thus both 1600x1200 and 1200x1600 use twice the type/spacing scale of
their small reference views. Pixel resolution alone does not establish physical reading size;
validate actual devices and their intended viewing distance before changing the reference.

Middle-size references are 30 px title, 15 px description/fact value, 12 px subtitle and
10.5 px fact labels. Description/body line-height is 1.3 and title line-height is 1.3. These
line boxes avoid the glyph-overflow feedback caused by fitting heavy titles at line-height
0.9. Title fitting aims for two lines with a bounded minimum; it never scales the entire
screen. Keep titles concise, descriptions to roughly 2–4 lines, and facts to short complete
phrases with their units. All text roles grow or shrink together through textSize.

The fitter reserves at least 46% of viewport height for stacked landscape artwork and 43%
for portrait artwork. Side-layout artwork gets the full content height. It tries alternative
fact column counts, then removes complete facts from the end of the selected list until the
content and image budget fit. Fact order is therefore an explicit editorial priority: place
identity and key distinguishing facts first, ancillary classification and source facts last.
Do not put critical information last. It never cuts values mid-sentence. When showFactCount
is enabled, a localized count such as “6 of 11 facts” explains the subset. This hint is hidden
by default and consumes no space. Hidden facts remain in the DOM and
are reconsidered on every refit, so a larger viewport restores them. This is a bounded subset,
not pagination: do not imply that unseen facts automatically rotate.

The return value contains `selectedFacts`, `visibleFacts`, `layout` and `hasOverflow`.
Equivalent counts and overflow status are exposed as data attributes on the root for QA.
`hasOverflow` must be false in the supported release matrix. A loaded marker alone is not a
layout acceptance check. If even the header does not fit, shorten the supplied content;
do not add an app-specific tiny-font escape hatch.

## Generation and regression loop

1. Generate catalog, translated copy and manifest using the main README contract.
2. Use the shared renderer, complete images, prioritized facts and localized count template.
3. Run `paperless check` for each integration.
4. Render 800x480, 480x800, 1600x1200 and 1200x1600.
5. Check small/middle/big text, default/all/no selected facts, header on/off, image-only,
   both optional counters independently on/off, all declared languages, light/dark and at least one accent theme.
6. Include longest names, wordiest entries, narrow and wide artwork and previously unused
   catalog entries. Check repeat INIT and viewport changes in the same page.
7. Assert no clipped text, sibling overlap, image outside its stage or incorrect counter visibility. Inspect native-resolution screenshots and Spectra-6 output visually.

The integrations repository includes `npm run check:of-the-day -- --full` for this browser
matrix. It uses the installed vendored runtime by default. During package development,
`--source-runtime` serves the sibling's built dist; the final run must use the installed
runtime after syncing the vendor and running npm install. This checks layout at device
pixels; it does not replace a physical display review.
