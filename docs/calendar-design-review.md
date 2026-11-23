# Calendar design options

The reviewed designs are now available as regular optional views in Google, Apple, Outlook, Nextcloud,
Proton, CalDAV and Webcal settings. Existing default views are unchanged.

- `agenda-modern`: large day numbers, open day groups, readable event titles and
  small provider-color markers. Times sit beside titles in landscape.
- `today-next`: today and upcoming days in separate areas, with the first ongoing
  or upcoming timed event emphasized. Portrait stacks the two areas.

The source implementation is in the sibling `paperlesspaper-openintegration`
repository (`src/calendar.ts`, `src/calendarIntegration.ts`, and
`src/styles/paperless.css`). This repository consumes the built vendored copy.

## Review images

The complete, refreshed collection is now versioned in
[screenshots/calendars](screenshots/calendars/README.md), including all nine views,
icons, automatic images, event-layout concepts and the seven provider previews.
It contains both display sizes and orientations, with browser and Spectra 6 PNGs.
The `output/` paths below are retained for reproducing the earlier review sessions.

Open `output/calendar-design-review/index.html` to compare all three layouts with
the same six fictional appointments and the fixed time 2026-07-22 12:00 Europe/Berlin.
Choose orientation, theme, and browser or processed Spectra 6 output. Clicking a
picture opens the full-size PNG. The generated comparison PNGs place the three
layouts side by side at their original pixel dimensions.

The `blue-dark` theme currently means blue foreground on white in the shared theme
system, so the gallery also includes the `dark` theme to inspect a black surface.
The designs respect those existing theme definitions.

## Reproduce

```sh
node scripts/render-calendar-design-review.mjs before
node scripts/render-calendar-design-review.mjs after
node scripts/build-calendar-design-gallery.mjs
```

`before` renders the retained classic agenda. `after` captures both optional views
and checks empty, dense and long-content states at 800×480, 480×800, 1600×1200 and
1200×1600. Each event must be visible or included in the additional-event count.
The script uses the official CLI development host, the actual Google adapter,
headless Chrome, and `epdoptimize` with the native Spectra 6 palette and error
diffusion. Output includes raw PNGs, processed device-color PNGs, fixture data and
JSON verification results. No live account or credentials are used.

For an interactive integration preview:

```sh
node node_modules/@paperlesspaper/openintegration/dist/cli.js dev applications/google-calendar/config.json --settings '{"view":"today-next","sampleData":true,"color":"blue-light"}'
```

`maxEvents` applies to each of the two lists in `today-next`. Dense layouts retain
readable typography and count whole hidden appointments. They do not guarantee
the same number of visible appointments as the compact classic agenda. No
production default or live deployment has been changed.

## Rolling week options: 13-inch and 7.3-inch

Two further regular options are available in **View & design**:
`rolling-week-list` (**Next 7 days (list)**) and `rolling-week`
(**Next 7 days (time grid)**). Both start today in the selected display
timezone and show exactly seven local dates, even across DST, month or year changes.
The standard Monday-first week and all existing defaults are unchanged.

The review uses 800×480 / 480×800 for 7.3-inch displays and 1600×1200 /
1200×1600 for 13-inch displays. The list uses columns in landscape and rows in
portrait. The portrait time grid has four days above three days, with matching hour
scales. The time grid supports overlapping, all-day and multi-day events. Short
appointments receive a minimum visual height; titles can be shortened in narrow
columns. Day lists count complete appointments hidden for lack of space.

```sh
node scripts/render-rolling-calendar-review.mjs
node scripts/build-rolling-calendar-gallery.mjs
```

Open `output/rolling-calendar-review/index.html`. The gallery contains both designs,
both orientations and light/dark themes at original resolution, with raw browser
and processed Spectra 6 PNGs. Its fixture is Friday 24 through Thursday 30 July
2026, with a free Sunday, a birthday, a two-day holiday and overlapping appointments.
The render script checks all seven dates, ready markers, JavaScript errors,
structural overflow and event collisions. These are regular optional views; the default selection remains unchanged.
