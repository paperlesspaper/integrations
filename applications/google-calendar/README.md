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

Settings can be passed through `meta.pluginSettings` or query parameters. Supported settings are `color`, `view`, `language`, `dayRange`, `maxEvents`, `highlightToday`, `highlightScale`, `showEventIcons`, and `showEventImages`.

Event titles or descriptions can include an icon marker:

```txt
[icon:medical] Dentist
```

The marker is removed from the displayed text. When `showEventIcons` is enabled, icon names render through Iconoir from jsDelivr. Use Iconoir class names without the `iconoir-` prefix, such as `[icon:airplane]`; friendly aliases such as `medical`, `birthday`, and `work` are mapped to Iconoir names. When `showEventImages` is enabled, the first safe image URL from an event description is displayed. Image extraction supports HTML `<img src="...">`, image links, and plain image URLs.

`view` supports:

- `agenda` (default)
- `day`
- `three-days`
- `week`
- `year`
