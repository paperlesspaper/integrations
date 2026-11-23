# Google Calendar

Displays Google Calendar events supplied by the paperlesspaper host. The provider adapter maps the Google event format into the shared calendar model; all views, date handling, fitting, and responsive styles come from `@paperlesspaper/openintegration`.

The integration accepts the legacy message shape:

```js
window.postMessage({
  cmd: "message",
  data: [{
    id: "1",
    summary: "Sprint planning",
    start: { dateTime: "2026-07-22T10:00:00+02:00", timeZone: "Europe/Berlin" },
    end: { dateTime: "2026-07-22T11:00:00+02:00", timeZone: "Europe/Berlin" },
    location: "Project room"
  }]
}, "*");
```

OpenIntegration payloads may provide an event array directly, as `{ "events": [...] }`, under `calendarData.events`, or under `meta.calendarData.events`. The `googleCalendar` host permission supplies the live data; this integration does not collect Google credentials.

## Common calendar settings

- `view`: `agenda`, `agenda-modern`, `today-next`, `rolling-week-list`, `rolling-week`, `day`, `three-days`, `week`, or `year`.
- `locale`: BCP 47 locale used for dates and times.
- `timeZone`: IANA timezone used for visible date ranges when an event has no timezone.
- `dayRange`: number of visible agenda days.
- `maxEvents`: agenda total or per-column display limit.
- `highlightToday` and `highlightScale`: optional current-day banner.
- `showLocation`: show event locations.
- `showEventIcons` and `showEventImages`: Google-specific presentation metadata supported by the common renderer.
- `eventImageSource`: `automatic` (default) checks all supported image sources; `description` restricts discovery to images in the event description. Neither mode fetches anything while `showEventImages` is off.

For backward compatibility, the shared settings normalizer accepts `language` as an alias for `locale`.

## Icons and images

Titles or descriptions can contain `[icon:name]`. The adapter removes the marker and maps common aliases such as `meeting`, `medical`, and `work` to Iconoir. Provider HTML is never sent to the common renderer.

When **Show event images** is enabled, **Event image sources → Automatic** tries these sources in order:

1. An explicit host-provided `imageUrl`, then `extendedProperties.private.ppImageUrl` or `extendedProperties.shared.ppImageUrl`.
2. Description images (`img src`, `data-src`, HTTP(S) `srcset` entries and Markdown images), followed by image links and plain image URLs.
3. Public HTTP(S) attachments with an `image/*` MIME type. Google Drive viewer links and attachment icons are not treated as photos.
4. Website links in the description, followed by `source.url` and an optional host-provided `url`. The API checks Open Graph (`og:image`, `og:image:url`, `og:image:secure_url`), Twitter image metadata, JSON-LD Event images and `itemprop="image"` metadata. Relative images resolve against the final redirected URL and an optional HTML base URL.

The first loadable image wins; failed candidates fall through to the next source. Images smaller than 64 × 48 are skipped. An event with no usable image remains a normal text event. Ordinary website images, logos and favicons are not selected automatically. Google Calendar, Meet, login and Drive viewer links are skipped. Private Drive attachments need a future authorized Drive adapter; this feature does not grant or request Drive access.

Example description:

```text
Jazz in the courtyard
https://culture.example.org/images/jazz.jpg
Tickets and details: https://culture.example.org/events/jazz
```

The direct image is tried first. If unavailable, the linked event page can supply its preview image. A page URL by itself also works. Pages that require login or JavaScript-generated metadata may not provide an image.

The adapter only processes up to 24 events in the visible date range (no image lookup in the year view), with four workers and a 12-second render budget. Each event contributes at most 12 direct image candidates and three website links. Website responses are limited to 512 KiB, three redirects and 4.5 seconds; destination DNS is checked and pinned on each server-side connection. Private/local addresses and nonstandard ports are rejected, including redirects. No calendar credentials, cookies or full descriptions are sent to those websites. The same-origin API receives only candidate page URLs via POST.

Page metadata is cached in memory for 15 minutes (misses for one minute), with bounded entries and concurrent requests. The browser briefly caches image success/failure. Updating the calendar cancels outstanding discovery so a stale render cannot overwrite a newer one. If the metadata API is unavailable, direct images can still work and the calendar remains usable.

The Google host must forward the relevant description, attachment or extended-property fields. The integration consumes supplied events; it does not fetch extra Google fields itself.

References: [Open Graph](https://ogp.me/), [Google event fields](https://developers.google.com/workspace/calendar/api/v3/reference/events).

Verification:

```sh
node --test tests/calendar-event-images.test.mjs tests/calendar-colors.test.mjs
PORT=3380 npm start
# In another terminal, with the Playwright CLI skill installed:
~/.codex/skills/playwright/scripts/playwright_cli.sh --session event-images open http://127.0.0.1:3380/google-calendar/render.html
node scripts/check-calendar-event-images.mjs
```

## Local verification

```sh
node dist/cli.js check ../paperlesspaper-integrations/applications/google-calendar/config.json
node dist/cli.js render ../paperlesspaper-integrations/applications/google-calendar/config.json --viewport 800x480 --output /tmp/google-calendar-landscape.png
node dist/cli.js render ../paperlesspaper-integrations/applications/google-calendar/config.json --viewport 480x800 --output /tmp/google-calendar-portrait.png
```

## Calendar colors

The host can supply `color` / `backgroundColor` and `calendarColor` on each event. For
Google-native metadata, `calendarData` (also under `meta`) can include `calendars`
(an array of CalendarList entries or a map keyed by calendar ID) and `colors`
(the Colors API response with separate `event` and `calendar` palettes). Associate
events with `calendarId`; `colorId` resolves through the supplied event palette.
A single calendar can instead be passed as `calendarData.calendar` or a
`calendarData.calendarColor` fallback. Event-specific color wins over calendar color.

Without color metadata, the renderer uses the global display theme. It does not
request Google credentials or guess user-specific colors from an unknown ID.
Sources: [CalendarList backgroundColor](https://developers.google.com/workspace/calendar/api/v3/reference/calendarList),
[Colors palettes](https://developers.google.com/workspace/calendar/api/v3/reference/colors).

## Calendar design options

Choose **View & design** in the integration settings:

- **Agenda (classic)** (`agenda`): the original compact chronological list.
- **Agenda (modern)** (`agenda-modern`): larger dates, open spacing and small calendar-color markers.
- **Today & next** (`today-next`): today and upcoming days, with the next or ongoing appointment highlighted.
- **Next 7 days (list)** (`rolling-week-list`): today plus six days, arranged as day lists.
- **Next 7 days (time grid)** (`rolling-week`): the same rolling week with appointments positioned by time.

The designs adapt to portrait and landscape and respect the selected color theme.
Modern agenda and Today & next use `dayRange`. Both rolling views always show seven
local dates starting today; `maxEvents` applies per day. In portrait, the rolling
time grid splits into four plus three days with the same hour scale. When space is limited, an additional-event count indicates hidden
appointments. In **Today & next**, `maxEvents` applies separately to today and the
upcoming list. Existing saved view values and the default classic agenda are preserved.

## Screenshots

- [Agenda, landscape](screenshots/google-calendar-light-800x480-landscape.png)
- [Agenda, portrait](screenshots/google-calendar-light-480x800-portrait.png)
- [Week, landscape](screenshots/google-calendar-highlight-800x480-landscape.png)
- [Week, portrait](screenshots/google-calendar-highlight-480x800-portrait.png)


<!-- calendar-personal:start -->
## Personal calendar options

All seven calendar integrations share these independently configurable options:

| Setting | Default | Behavior |
| --- | --- | --- |
| `showDaySummary` | `false` | Remaining timed appointments (including ongoing ones), separate all-day count, next appointment and last known end today. Uses the selected timezone and shows the render/update time. |
| `automaticEventIcons` | `false` | Local German/English title rules suggest icons for birthdays, medical appointments, flights, school, shopping, calls, music, cinema, cycling, coffee and meetings. Unknown titles keep their plain appearance. |
| `showEventIcons` | `true` | Master switch for manual and automatic icons. Explicit `iconName` or `[icon:…]` takes priority over suggestions. |
| `showHeader` | `true` | Hide or show the entire provider/personal header, independently of the day summary. |
| `personalTitle` / `personalSubtitle` | empty | Override the existing heading/subtitle. Blank values retain provider defaults. Text only; maximum 100/160 characters. |
| `informationDensity` | `comfortable` | `comfortable` preserves the standard layout. `automatic` measures available space using shared `fitText`; `compact` reduces type and spacing, `spacious` enlarges them. The existing `fontSize` setting remains effective. |

Agenda, day columns, modern agenda, Today & next and rolling lists show `+ more` for whole appointments that cannot fit. Automatic modern and rolling lists grow/shrink text within a bounded range before hiding entries; classic views reuse their existing text fitting with counted overflow, while time grids retain proportional time geometry. Resizing recomputes fitting and restores entries when space becomes available. No locations or event images are silently disabled by the density setting.

The day summary uses all loaded events for today before the display's `maxEvents` limit. Ended events are excluded; an appointment without an end is counted until its start time. Missing end times, overnight appointments and all-day events suppress the last-end statement. The summary describes the loaded calendar data, not availability across other accounts; it updates when the host renders fresh data, with no per-minute display refresh.

Common icons are bundled SVG artwork and work offline. Other explicit Iconoir names use the integration's existing Iconoir stylesheet. Google accepts manual tokens in the title and description; iCalendar feeds preserve description tokens too. Outlook title tokens work without requesting extra description fields. Suggestions never rewrite source events or send titles to an external service.

Suggested setup: modern agenda or Today & next, `showDaySummary: true`, `automaticEventIcons: true`, `informationDensity: "automatic"`, and your own title. Extra features are opt-in so existing displays keep their presentation.

The screenshot variants include 7.3-inch and 13-inch displays in both orientations.
<!-- calendar-personal:end -->

## Minimal day timeline

Select **Day timeline (minimal)** (`view: "day-timeline"`) under **View & design**. The layout shows the current local day with a proportional time axis, native-color event rails, overlapping appointments in separate lanes and a large next-event time. In portrait, the next event and due list move below the timeline. Source calendar colors and the global light/dark theme remain active.

The visual reference is [Clean minimal calendar plugin by iUnstable0](https://www.reddit.com/r/trmnl/comments/1xhfqqt/clean_minimal_calendar_plugin/). This is an independent implementation in the shared paperlesspaper renderer; it does not use the reference project's code or server.

| Option | Default | Behavior |
| --- | --- | --- |
| `timelineShowSidebar` | `true` | Next appointment plus due/all-day list. When disabled, due/all-day entries remain above the time axis. |
| `timelineShowNow` | `true` | Red “Now” marker at render time, without a numeric clock label. It refreshes with the calendar, not continuously. |
| `timelineShowGaps` | `true` | Labels gaps between known timed commitments. All-day events, unknown end times and DST-crossing intervals suppress these labels. |
| `timelineGapMinutes` | `30` | Minimum labeled gap, configurable from 15 to 240 minutes. |

Mark a calendar event with `[todo]` in its title to put it in **Due today**. Its start/date is its due time. Google and iCalendar feeds also accept the marker in the event description. Host adapters may supply `kind: "task"` in the canonical event shape. These are read-only calendar deadlines, not a connection to Google Tasks, Microsoft To Do or iCalendar VTODO. Task deadlines do not stretch the timeline or count as occupied time. Explicitly non-busy events (`busy: false`, Google transparent events or iCalendar `TRANSP:TRANSPARENT`) do not bound free gaps.

The timeline uses the complete loaded day to establish its range and gaps even if `maxEvents` hides entries. Very short appointments retain a readable minimum height; overlapping visual blocks use lanes, and events that cannot fit in those lanes are counted in `+ more`. Location/time details are omitted from short blocks before titles are clipped. Full event time/title remain in accessible markup. The next-event panel prefers the next future appointment, then an ongoing appointment if no future one exists. Due entries are plain text rather than inactive checkboxes; ongoing appointments use only a colored rail, without an enclosing outline. Text line boxes reserve space for descenders before overflow fitting.

Existing personal heading, icon, image, font-size and information-density settings continue to apply. Choosing this view is optional and does not change the default calendar view.
