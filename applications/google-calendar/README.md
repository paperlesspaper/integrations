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

- `view`: `agenda`, `day`, `three-days`, `week`, or `year`.
- `locale`: BCP 47 locale used for dates and times.
- `timeZone`: IANA timezone used for visible date ranges when an event has no timezone.
- `dayRange`: number of visible agenda days.
- `maxEvents`: agenda total or per-column display limit.
- `highlightToday` and `highlightScale`: optional current-day banner.
- `showLocation`: show event locations.
- `showEventIcons` and `showEventImages`: Google-specific presentation metadata supported by the common renderer.

For backward compatibility, the shared settings normalizer accepts `language` as an alias for `locale`.

## Icons and images

Titles or descriptions can contain `[icon:name]`. The adapter removes the marker and maps common aliases such as `meeting`, `medical`, and `work` to Iconoir. When images are enabled, it extracts the first safe HTTP(S) image from an HTML image, image link, or plain image URL in the description. Provider HTML is never sent to the common renderer.

## Local verification

```sh
node dist/cli.js check ../paperlesspaper-integrations/applications/google-calendar/config.json
node dist/cli.js render ../paperlesspaper-integrations/applications/google-calendar/config.json --viewport 800x480 --output /tmp/google-calendar-landscape.png
node dist/cli.js render ../paperlesspaper-integrations/applications/google-calendar/config.json --viewport 480x800 --output /tmp/google-calendar-portrait.png
```
