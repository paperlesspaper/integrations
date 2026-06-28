# Google Calendar

Displays upcoming Google Calendar events on a paperlesspaper display.

The page is a plain OpenIntegration render page and does not use React. It accepts the same legacy postMessage shape as the older app:

```js
window.postMessage(
  {
    cmd: "message",
    data: [
      {
        kind: "calendar#event",
        id: "1",
        summary: "Sprint planning",
        start: { dateTime: "2026-06-29T10:00:00+02:00", timeZone: "Europe/Berlin" },
        end: { dateTime: "2026-06-29T11:00:00+02:00", timeZone: "Europe/Berlin" }
      }
    ]
  },
  "*"
);
```

It also accepts OpenIntegration payloads where events are provided as:

- an array
- `{ "events": [...] }`
- `{ "calendarData": { "events": [...] } }`
- `{ "meta": { "calendarData": { "events": [...] } } }`

Settings can be passed through `meta.pluginSettings` or query parameters. Supported settings are `color`, `view`, `language`, `dayRange`, `maxEvents`, `highlightToday`, and `highlightScale`.

`view` supports:

- `agenda` (default)
- `day`
- `three-days`
- `week`
- `year`
