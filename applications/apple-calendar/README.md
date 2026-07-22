# Apple Calendar

Displays a read-only Apple/iCloud calendar from its **Public Calendar** subscription link. The adapter fetches and expands iCalendar data on the server, maps it to the common calendar event model, and uses the same shared views and settings as Google Calendar, Churchdesk, and the other calendar integrations.

## Setup

1. In iCloud Calendar, enable **Public Calendar** for the calendar you want to display.
2. Copy the generated `webcal://` link.
3. Paste it into `calendarUrl`. The integration upgrades `webcal://` or `http://` to HTTPS and accepts only Apple iCloud hosts.

Apple documents that anyone with the public link can view or subscribe to the calendar, so treat it as a secret capability URL. The link is fetched only by `api/data.js`; it is never returned in the display payload or errors. See [Apple's public calendar guide](https://support.apple.com/guide/icloud/what-you-can-do-with-icloud-and-calendar-mm15eb200ab4/icloud) and [Apple's iCalendar download instructions](https://support.apple.com/en-ie/108306).

Apple's published feed contains events from the last six months and up to three years in the future. Events outside that provider-defined horizon cannot be displayed by this integration.

This first version deliberately does not collect an Apple Account password or use private iCloud CalDAV. A local “On My Mac” calendar must first be published elsewhere; a one-time `.ics` export does not update automatically.

## Shared calendar settings

`view`, `locale`, `timeZone`, `dayRange`, `maxEvents`, `highlightToday`, `highlightScale`, and `showLocation` are interpreted by the reusable calendar toolkit. Supported views are `agenda`, `day`, `three-days`, `week`, and `year`.

The server adapter uses the shared iCalendar parser for folded text, all-day values, timezones, recurrence rules, exclusions, moved occurrences, and cancellations. `maxEvents` remains a presentation limit; the adapter independently keeps up to 500 normalized events so later days are not starved. Requests also have redirect, timeout, response-size, source-event, and occurrence limits.

## Privacy note

The settings form masks `calendarUrl`. The renderer sends adapter settings to the same-origin endpoint as a JSON `POST`, so the capability URL is not placed in the request URL or normal query-string access logs. The trusted renderer and server adapter still receive the link; use HTTPS, do not log request bodies, and revoke the public link in iCloud if it is exposed.

## Local verification

```sh
node dist/cli.js check ../paperlesspaper-integrations/applications/apple-calendar/config.json
node dist/cli.js render ../paperlesspaper-integrations/applications/apple-calendar/config.json --viewport 800x480 --output /tmp/apple-calendar-landscape.png
node dist/cli.js render ../paperlesspaper-integrations/applications/apple-calendar/config.json --viewport 480x800 --output /tmp/apple-calendar-portrait.png
```
